
-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'INFO',
  title text NOT NULL,
  message text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PAYMENT ATTEMPTS ============
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  method text NOT NULL,            -- 'PIX' | 'BOLETO' | 'CARD'
  amount numeric(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  gateway_ref text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pay_attempts_res ON public.payment_attempts(reservation_id);

GRANT SELECT, INSERT ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own payment attempts" ON public.payment_attempts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.reservations r
            WHERE r.id = payment_attempts.reservation_id
              AND (r.user_id = auth.uid()
                   OR public.is_institution_admin(auth.uid(), r.institution_id)
                   OR public.has_role(auth.uid(), 'PLATFORM_ADMIN')))
  );

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.gen_reservation_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text; n int := 0;
BEGIN
  LOOP
    c := 'TDB-' || upper(substring(encode(gen_random_bytes(5), 'hex'), 1, 6));
    IF NOT EXISTS (SELECT 1 FROM public.reservations WHERE reservation_code = c) THEN
      RETURN c;
    END IF;
    n := n + 1;
    IF n > 8 THEN RAISE EXCEPTION 'unable to generate unique code'; END IF;
  END LOOP;
END $$;

-- Prevent duplicate active reservations of the same scholarship by the same user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_reservation
  ON public.reservations(user_id, scholarship_id)
  WHERE status IN ('RESERVED','PAYMENT_PENDING','CONFIRMED','UNDER_REVIEW','AWAITING_ENROLLMENT');

-- ============ CREATE RESERVATION ============
CREATE OR REPLACE FUNCTION public.create_reservation(p_scholarship_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sch public.scholarships%ROWTYPE;
  v_off public.course_offerings%ROWTYPE;
  v_inst_id uuid;
  v_code text;
  v_res public.reservations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='28000'; END IF;

  SELECT * INTO v_sch FROM public.scholarships WHERE id = p_scholarship_id FOR UPDATE;
  IF NOT FOUND OR NOT v_sch.is_active THEN RAISE EXCEPTION 'Bolsa indisponível'; END IF;
  IF v_sch.end_at IS NOT NULL AND v_sch.end_at < now() THEN RAISE EXCEPTION 'Bolsa expirada'; END IF;
  IF v_sch.max_uses IS NOT NULL AND v_sch.used_count >= v_sch.max_uses THEN
    RAISE EXCEPTION 'Bolsa esgotada';
  END IF;

  SELECT * INTO v_off FROM public.course_offerings WHERE id = v_sch.course_offering_id FOR UPDATE;
  IF v_off.vacancies_available IS NULL OR v_off.vacancies_available <= 0 THEN
    RAISE EXCEPTION 'Sem vagas disponíveis';
  END IF;

  SELECT u.institution_id INTO v_inst_id
  FROM public.institution_units u WHERE u.id = v_off.institution_unit_id;

  v_code := public.gen_reservation_code();

  INSERT INTO public.reservations (
    user_id, scholarship_id, course_offering_id, institution_id,
    reservation_code, status, payment_status, amount_paid, expires_at
  ) VALUES (
    v_uid, v_sch.id, v_off.id, v_inst_id,
    v_code, 'PAYMENT_PENDING', 'PENDING', v_sch.price_with_scholarship,
    now() + interval '48 hours'
  ) RETURNING * INTO v_res;

  UPDATE public.scholarships SET used_count = used_count + 1 WHERE id = v_sch.id;
  UPDATE public.course_offerings SET vacancies_available = vacancies_available - 1 WHERE id = v_off.id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'RESERVATION_CREATED',
    'Bolsa reservada! Código ' || v_code,
    'Conclua o pagamento da taxa de adesão em até 48h para garantir sua vaga.',
    '/reservas/' || v_res.id::text);

  RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid) TO authenticated;

-- ============ PAY RESERVATION (simulated) ============
CREATE OR REPLACE FUNCTION public.pay_reservation(p_reservation_id uuid, p_method text)
RETURNS public.reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_res public.reservations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='28000'; END IF;
  IF p_method NOT IN ('PIX','BOLETO','CARD') THEN RAISE EXCEPTION 'Método inválido'; END IF;

  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR v_res.user_id <> v_uid THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.status NOT IN ('PAYMENT_PENDING','RESERVED') THEN
    RAISE EXCEPTION 'Reserva não pode ser paga (status %)', v_res.status;
  END IF;
  IF v_res.expires_at IS NOT NULL AND v_res.expires_at < now() THEN
    RAISE EXCEPTION 'Reserva expirada';
  END IF;

  INSERT INTO public.payment_attempts (reservation_id, method, amount, status, gateway_ref, paid_at)
  VALUES (p_reservation_id, p_method, v_res.amount_paid, 'PAID',
          'SIM-' || upper(substring(encode(gen_random_bytes(6),'hex'),1,10)), now());

  UPDATE public.reservations
  SET status = 'CONFIRMED', payment_status = 'PAID', expires_at = NULL
  WHERE id = p_reservation_id
  RETURNING * INTO v_res;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'PAYMENT_CONFIRMED',
    'Pagamento confirmado ✅',
    'Sua bolsa ' || v_res.reservation_code || ' está confirmada. A instituição entrará em contato para a matrícula.',
    '/reservas');

  RETURN v_res;
END $$;
REVOKE EXECUTE ON FUNCTION public.pay_reservation(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pay_reservation(uuid, text) TO authenticated;

-- ============ CANCEL RESERVATION ============
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_res public.reservations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR v_res.user_id <> v_uid THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.status IN ('CANCELLED','EXPIRED','ENROLLMENT_APPROVED','ENROLLMENT_REJECTED') THEN
    RETURN v_res;
  END IF;

  UPDATE public.reservations SET status='CANCELLED', payment_status='CANCELLED', expires_at=NULL
   WHERE id = p_reservation_id RETURNING * INTO v_res;

  -- return vacancy and decrement scholarship usage only if it wasn't paid yet
  IF v_res.payment_status <> 'PAID' THEN
    UPDATE public.course_offerings SET vacancies_available = vacancies_available + 1
     WHERE id = v_res.course_offering_id;
    UPDATE public.scholarships SET used_count = GREATEST(used_count - 1, 0)
     WHERE id = v_res.scholarship_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'RESERVATION_CANCELLED',
    'Reserva cancelada',
    'Sua reserva ' || v_res.reservation_code || ' foi cancelada.',
    '/reservas');

  RETURN v_res;
END $$;
REVOKE EXECUTE ON FUNCTION public.cancel_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid) TO authenticated;

-- ============ EXPIRE RESERVATIONS (cron) ============
CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.reservations
    WHERE status IN ('PAYMENT_PENDING','RESERVED')
      AND expires_at IS NOT NULL AND expires_at < now()
    FOR UPDATE
  LOOP
    UPDATE public.reservations SET status='EXPIRED', payment_status='CANCELLED' WHERE id = r.id;
    UPDATE public.course_offerings SET vacancies_available = vacancies_available + 1 WHERE id = r.course_offering_id;
    UPDATE public.scholarships SET used_count = GREATEST(used_count - 1, 0) WHERE id = r.scholarship_id;
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (r.user_id, 'RESERVATION_EXPIRED',
      'Reserva expirada',
      'Sua reserva ' || r.reservation_code || ' expirou por falta de pagamento.',
      '/bolsas');
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_reservations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_reservations() TO service_role;

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
