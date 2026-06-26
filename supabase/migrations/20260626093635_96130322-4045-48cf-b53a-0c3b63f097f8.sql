
CREATE TYPE public.pricing_scope_type AS ENUM ('GLOBAL','INSTITUTION','COURSE','SCHOLARSHIP');
CREATE TYPE public.pricing_type AS ENUM ('FIXED_AMOUNT','PERCENTAGE_OF_COURSE_VALUE','FIRST_MONTHLY_PAYMENT');

CREATE TABLE public.marketplace_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type public.pricing_scope_type NOT NULL,
  scope_id uuid,
  pricing_type public.pricing_type NOT NULL,
  fixed_amount numeric(10,2),
  percentage_rate numeric(5,2),
  minimum_amount numeric(10,2),
  maximum_amount numeric(10,2),
  letter_validity_days int NOT NULL DEFAULT 30,
  fee_display_name text NOT NULL DEFAULT 'Matrícula Tô de Bolsa',
  fee_description text,
  currency text NOT NULL DEFAULT 'BRL',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_scope_id_required CHECK (
    (scope_type = 'GLOBAL' AND scope_id IS NULL) OR
    (scope_type <> 'GLOBAL' AND scope_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX uniq_marketplace_pricing_scope
  ON public.marketplace_pricing_rules(scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE is_active;

GRANT SELECT ON public.marketplace_pricing_rules TO authenticated, anon;
GRANT ALL ON public.marketplace_pricing_rules TO service_role;
ALTER TABLE public.marketplace_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read active pricing rules"
  ON public.marketplace_pricing_rules FOR SELECT
  USING (is_active OR public.is_platform_admin());

CREATE POLICY "admins manage pricing rules"
  ON public.marketplace_pricing_rules FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER trg_pricing_rules_updated
  BEFORE UPDATE ON public.marketplace_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.marketplace_pricing_rules
  (scope_type, pricing_type, fixed_amount, fee_display_name, fee_description, letter_validity_days)
VALUES
  ('GLOBAL','FIXED_AMOUNT', 59.90, 'Matrícula Tô de Bolsa',
   'Pagamento único ao Tô de Bolsa para reservar a bolsa e emitir a Carta de Apresentação. As mensalidades, quando houver, são tratadas diretamente com a instituição de ensino.',
   30);

CREATE TYPE public.scholarship_letter_status AS ENUM ('ISSUED','USED','EXPIRED','CANCELLED');

CREATE TABLE public.scholarship_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL UNIQUE REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE RESTRICT,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
  unique_code text NOT NULL UNIQUE,
  status public.scholarship_letter_status NOT NULL DEFAULT 'ISSUED',
  amount_charged numeric(10,2) NOT NULL,
  pricing_snapshot jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  validation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.scholarship_letters TO authenticated;
GRANT ALL ON public.scholarship_letters TO service_role;
ALTER TABLE public.scholarship_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own letters"
  ON public.scholarship_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "institution admins read their letters"
  ON public.scholarship_letters FOR SELECT USING (public.is_institution_admin(auth.uid(), institution_id));
CREATE POLICY "platform admins read all letters"
  ON public.scholarship_letters FOR SELECT USING (public.is_platform_admin());
CREATE POLICY "platform admins update letters"
  ON public.scholarship_letters FOR UPDATE USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE INDEX idx_letters_user ON public.scholarship_letters(user_id);
CREATE INDEX idx_letters_institution ON public.scholarship_letters(institution_id);
CREATE INDEX idx_letters_status ON public.scholarship_letters(status);

CREATE TRIGGER trg_letters_updated
  BEFORE UPDATE ON public.scholarship_letters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.letter_validation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.scholarship_letters(id) ON DELETE CASCADE,
  institution_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('VIEWED','ATTENDED','ENROLLED','NO_SHOW','EXPIRED','NOTE','CANCELLED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.letter_validation_events TO authenticated;
GRANT ALL ON public.letter_validation_events TO service_role;
ALTER TABLE public.letter_validation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution and admin manage letter events"
  ON public.letter_validation_events FOR ALL
  USING (public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.scholarship_letters l
    WHERE l.id = letter_id AND public.is_institution_admin(auth.uid(), l.institution_id)
  ))
  WITH CHECK (public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.scholarship_letters l
    WHERE l.id = letter_id AND public.is_institution_admin(auth.uid(), l.institution_id)
  ));

CREATE POLICY "student reads own letter events"
  ON public.letter_validation_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scholarship_letters l WHERE l.id = letter_id AND l.user_id = auth.uid()));

CREATE INDEX idx_letter_events_letter ON public.letter_validation_events(letter_id, created_at DESC);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pricing_rule_id uuid REFERENCES public.marketplace_pricing_rules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS letter_id uuid REFERENCES public.scholarship_letters(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.calculate_reservation_fee(p_scholarship_id uuid)
RETURNS TABLE(amount numeric, rule_id uuid, validity_days int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sch public.scholarships%ROWTYPE;
  v_off public.course_offerings%ROWTYPE;
  v_inst_id uuid;
  v_course_id uuid;
  v_rule public.marketplace_pricing_rules%ROWTYPE;
  v_value numeric;
  v_course_value numeric;
BEGIN
  SELECT * INTO v_sch FROM public.scholarships WHERE id = p_scholarship_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bolsa não encontrada'; END IF;

  SELECT * INTO v_off FROM public.course_offerings WHERE id = v_sch.course_offering_id;
  v_course_id := v_off.course_id;
  SELECT u.institution_id INTO v_inst_id
    FROM public.institution_units u WHERE u.id = v_off.institution_unit_id;

  SELECT * INTO v_rule FROM public.marketplace_pricing_rules
    WHERE is_active AND scope_type = 'SCHOLARSHIP' AND scope_id = p_scholarship_id LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_rule FROM public.marketplace_pricing_rules
      WHERE is_active AND scope_type = 'COURSE' AND scope_id = v_course_id LIMIT 1;
  END IF;
  IF NOT FOUND THEN
    SELECT * INTO v_rule FROM public.marketplace_pricing_rules
      WHERE is_active AND scope_type = 'INSTITUTION' AND scope_id = v_inst_id LIMIT 1;
  END IF;
  IF NOT FOUND THEN
    SELECT * INTO v_rule FROM public.marketplace_pricing_rules
      WHERE is_active AND scope_type = 'GLOBAL' LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhuma regra de preço ativa configurada.'; END IF;

  CASE v_rule.pricing_type
    WHEN 'FIXED_AMOUNT' THEN
      v_value := COALESCE(v_rule.fixed_amount, 0);
    WHEN 'PERCENTAGE_OF_COURSE_VALUE' THEN
      SELECT COALESCE(c.original_price, 0) INTO v_course_value
        FROM public.courses c WHERE c.id = v_course_id;
      v_value := round(v_course_value * COALESCE(v_rule.percentage_rate, 0) / 100, 2);
    WHEN 'FIRST_MONTHLY_PAYMENT' THEN
      v_value := COALESCE(v_sch.price_with_scholarship, 0);
  END CASE;

  IF v_rule.minimum_amount IS NOT NULL AND v_value < v_rule.minimum_amount THEN v_value := v_rule.minimum_amount; END IF;
  IF v_rule.maximum_amount IS NOT NULL AND v_value > v_rule.maximum_amount THEN v_value := v_rule.maximum_amount; END IF;

  RETURN QUERY SELECT v_value, v_rule.id, v_rule.letter_validity_days;
END $$;
GRANT EXECUTE ON FUNCTION public.calculate_reservation_fee(uuid) TO authenticated, anon;

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
  v_fee numeric;
  v_rule_id uuid;
  v_validity int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='28000'; END IF;
  SELECT * INTO v_sch FROM public.scholarships WHERE id = p_scholarship_id FOR UPDATE;
  IF NOT FOUND OR NOT v_sch.is_active THEN RAISE EXCEPTION 'Bolsa indisponível'; END IF;
  IF v_sch.end_at IS NOT NULL AND v_sch.end_at < now() THEN RAISE EXCEPTION 'Bolsa expirada'; END IF;
  IF v_sch.max_uses IS NOT NULL AND v_sch.used_count >= v_sch.max_uses THEN RAISE EXCEPTION 'Bolsa esgotada'; END IF;
  SELECT * INTO v_off FROM public.course_offerings WHERE id = v_sch.course_offering_id FOR UPDATE;
  IF v_off.vacancies_available IS NULL OR v_off.vacancies_available <= 0 THEN RAISE EXCEPTION 'Sem vagas disponíveis'; END IF;
  SELECT u.institution_id INTO v_inst_id FROM public.institution_units u WHERE u.id = v_off.institution_unit_id;
  SELECT amount, rule_id, validity_days INTO v_fee, v_rule_id, v_validity FROM public.calculate_reservation_fee(p_scholarship_id);
  v_code := public.gen_reservation_code();
  INSERT INTO public.reservations (
    user_id, scholarship_id, course_offering_id, institution_id,
    reservation_code, status, payment_status, amount_paid, expires_at, pricing_rule_id
  ) VALUES (
    v_uid, v_sch.id, v_off.id, v_inst_id,
    v_code, 'PAYMENT_PENDING', 'PENDING', v_fee, now() + interval '48 hours', v_rule_id
  ) RETURNING * INTO v_res;
  UPDATE public.scholarships SET used_count = used_count + 1 WHERE id = v_sch.id;
  UPDATE public.course_offerings SET vacancies_available = vacancies_available - 1 WHERE id = v_off.id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'RESERVATION_CREATED',
    'Bolsa reservada! Código ' || v_code,
    'Conclua o pagamento único de R$ ' || replace(to_char(v_fee, 'FM999990.00'), '.', ',') ||
    ' ao Tô de Bolsa em até 48h para emitir sua Carta de Apresentação.',
    '/reservas/' || v_res.id::text);
  RETURN v_res;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_reservation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gen_letter_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text; n int := 0;
BEGIN
  LOOP
    c := 'TDB-' || upper(substring(encode(gen_random_bytes(6),'hex'),1,10));
    IF NOT EXISTS (SELECT 1 FROM public.scholarship_letters WHERE unique_code = c) THEN RETURN c; END IF;
    n := n + 1;
    IF n > 8 THEN RAISE EXCEPTION 'unable to generate unique letter code'; END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.issue_scholarship_letter(p_reservation_id uuid)
RETURNS public.scholarship_letters
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_rule public.marketplace_pricing_rules%ROWTYPE;
  v_validity int := 30;
  v_letter public.scholarship_letters%ROWTYPE;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.payment_status <> 'PAID' THEN RAISE EXCEPTION 'Reserva ainda não foi paga.'; END IF;
  SELECT * INTO v_letter FROM public.scholarship_letters WHERE reservation_id = p_reservation_id;
  IF FOUND THEN RETURN v_letter; END IF;
  IF v_res.pricing_rule_id IS NOT NULL THEN
    SELECT * INTO v_rule FROM public.marketplace_pricing_rules WHERE id = v_res.pricing_rule_id;
    IF FOUND THEN v_validity := COALESCE(v_rule.letter_validity_days, 30); END IF;
  END IF;
  INSERT INTO public.scholarship_letters (
    reservation_id, user_id, scholarship_id, institution_id,
    unique_code, amount_charged, pricing_snapshot, expires_at
  ) VALUES (
    v_res.id, v_res.user_id, v_res.scholarship_id, v_res.institution_id,
    public.gen_letter_code(), COALESCE(v_res.amount_paid, 0),
    CASE WHEN v_rule.id IS NOT NULL THEN to_jsonb(v_rule) ELSE NULL END,
    now() + (v_validity || ' days')::interval
  ) RETURNING * INTO v_letter;
  UPDATE public.reservations SET letter_id = v_letter.id WHERE id = v_res.id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_res.user_id, 'LETTER_ISSUED',
    'Carta de Apresentação emitida 📄',
    'Sua Carta de Apresentação (' || v_letter.unique_code || ') foi emitida. Apresente-a na instituição em até ' || v_validity || ' dias.',
    '/reservas/' || v_res.id::text);
  RETURN v_letter;
END $$;
GRANT EXECUTE ON FUNCTION public.issue_scholarship_letter(uuid) TO authenticated, service_role;

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
  IF v_res.status NOT IN ('PAYMENT_PENDING','RESERVED') THEN RAISE EXCEPTION 'Reserva não pode ser paga (status %)', v_res.status; END IF;
  IF v_res.expires_at IS NOT NULL AND v_res.expires_at < now() THEN RAISE EXCEPTION 'Reserva expirada'; END IF;
  INSERT INTO public.payment_attempts (reservation_id, method, amount, status, gateway_ref, paid_at)
  VALUES (p_reservation_id, p_method, v_res.amount_paid, 'PAID',
          'SIM-' || upper(substring(encode(gen_random_bytes(6),'hex'),1,10)), now());
  UPDATE public.reservations
  SET status = 'CONFIRMED', payment_status = 'PAID', expires_at = NULL
  WHERE id = p_reservation_id RETURNING * INTO v_res;
  PERFORM public.issue_scholarship_letter(p_reservation_id);
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'PAYMENT_CONFIRMED',
    'Pagamento confirmado ✅',
    'Sua reserva ' || v_res.reservation_code || ' foi confirmada e a Carta de Apresentação está disponível.',
    '/reservas/' || v_res.id::text);
  RETURN v_res;
END $$;
REVOKE EXECUTE ON FUNCTION public.pay_reservation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_reservation(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_letter_by_code(p_code text)
RETURNS TABLE(
  unique_code text,
  status public.scholarship_letter_status,
  issued_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  student_first_name text,
  scholarship_title text,
  course_name text,
  institution_trade_name text,
  unit_name text,
  unit_city text,
  unit_state text,
  discount_percent numeric,
  monthly_with_scholarship numeric,
  monthly_original numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    l.unique_code, l.status, l.issued_at, l.expires_at, l.used_at,
    split_part(p.name, ' ', 1) AS student_first_name,
    s.title AS scholarship_title,
    c.name AS course_name,
    i.trade_name AS institution_trade_name,
    u.name AS unit_name, u.city AS unit_city, u.state AS unit_state,
    CASE
      WHEN s.discount_type = 'PERCENT' THEN s.discount_value
      WHEN COALESCE(c.original_price,0) > 0
        THEN round((1 - s.price_with_scholarship / c.original_price) * 100, 0)
      ELSE NULL
    END AS discount_percent,
    s.price_with_scholarship AS monthly_with_scholarship,
    c.original_price AS monthly_original
  FROM public.scholarship_letters l
  JOIN public.profiles p ON p.id = l.user_id
  JOIN public.scholarships s ON s.id = l.scholarship_id
  JOIN public.course_offerings co ON co.id = s.course_offering_id
  JOIN public.courses c ON c.id = co.course_id
  JOIN public.institution_units u ON u.id = co.institution_unit_id
  JOIN public.institutions i ON i.id = l.institution_id
  WHERE l.unique_code = p_code;
$$;
GRANT EXECUTE ON FUNCTION public.get_letter_by_code(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.expire_scholarship_letters()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.scholarship_letters
    SET status = 'EXPIRED'
    WHERE status = 'ISSUED' AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_scholarship_letters() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_scholarship_letters() TO service_role;
