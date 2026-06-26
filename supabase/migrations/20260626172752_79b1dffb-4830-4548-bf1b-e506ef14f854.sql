
ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS refunds_stripe_refund_id_uq
  ON public.refunds(stripe_refund_id) WHERE stripe_refund_id IS NOT NULL;

-- Aluno solicita cancelamento da própria reserva (apenas cria o pedido)
CREATE OR REPLACE FUNCTION public.student_request_refund(
  p_reservation_id uuid,
  p_reason text
) RETURNS public.refunds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_res public.reservations%ROWTYPE;
  v_existing public.refunds%ROWTYPE;
  v_refund public.refunds%ROWTYPE;
  v_admin_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.user_id <> v_uid THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_res.payment_status <> 'PAID' THEN
    RAISE EXCEPTION 'Apenas reservas pagas podem ser canceladas com reembolso.';
  END IF;

  SELECT * INTO v_existing FROM public.refunds
    WHERE reservation_id = p_reservation_id
      AND status IN ('REQUESTED','PROCESSED')
    LIMIT 1;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.refunds(reservation_id, amount, reason, status, requested_by)
  VALUES (p_reservation_id, v_res.amount_paid, NULLIF(p_reason,''), 'REQUESTED', v_uid)
  RETURNING * INTO v_refund;

  -- Notifica todos os admins
  FOR v_admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'PLATFORM_ADMIN'
  LOOP
    INSERT INTO public.notifications(user_id, type, title, message, link)
    VALUES (v_admin_id, 'REFUND_REQUESTED',
      'Novo pedido de reembolso',
      'Aluno solicitou o cancelamento da reserva ' || v_res.reservation_code || '.',
      '/admin/financeiro/reembolsos');
  END LOOP;

  RETURN v_refund;
END $$;

GRANT EXECUTE ON FUNCTION public.student_request_refund(uuid, text) TO authenticated;

-- Admin confirma o reembolso após executar o estorno na Stripe
CREATE OR REPLACE FUNCTION public.complete_refund(
  p_reservation_id uuid,
  p_reason text,
  p_stripe_refund_id text DEFAULT NULL
) RETURNS public.refunds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_pay public.payment_attempts%ROWTYPE;
  v_refund public.refunds%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.payment_status NOT IN ('PAID') THEN
    RAISE EXCEPTION 'Apenas reservas pagas podem ser reembolsadas.';
  END IF;

  SELECT * INTO v_pay FROM public.payment_attempts
    WHERE reservation_id = p_reservation_id AND status = 'PAID'
    ORDER BY paid_at DESC NULLS LAST LIMIT 1;

  -- Reaproveita um pedido REQUESTED, ou cria/atualiza idempotente por stripe_refund_id
  SELECT * INTO v_refund FROM public.refunds
   WHERE (p_stripe_refund_id IS NOT NULL AND stripe_refund_id = p_stripe_refund_id)
      OR (reservation_id = p_reservation_id AND status = 'REQUESTED')
   ORDER BY status DESC LIMIT 1;

  IF FOUND THEN
    UPDATE public.refunds
      SET status = 'PROCESSED',
          reason = COALESCE(NULLIF(p_reason,''), reason),
          stripe_refund_id = COALESCE(p_stripe_refund_id, stripe_refund_id),
          processed_by = auth.uid(),
          processed_at = now(),
          payment_attempt_id = COALESCE(payment_attempt_id, v_pay.id),
          amount = v_res.amount_paid,
          updated_at = now()
     WHERE id = v_refund.id
    RETURNING * INTO v_refund;
  ELSE
    INSERT INTO public.refunds(reservation_id, payment_attempt_id, amount, reason, status, processed_by, stripe_refund_id)
    VALUES (p_reservation_id, v_pay.id, v_res.amount_paid, NULLIF(p_reason,''), 'PROCESSED', auth.uid(), p_stripe_refund_id)
    RETURNING * INTO v_refund;
  END IF;

  UPDATE public.payment_attempts SET status = 'REFUNDED' WHERE id = v_pay.id;
  UPDATE public.reservations
     SET status = 'CANCELLED', payment_status = 'REFUNDED', expires_at = NULL
   WHERE id = p_reservation_id;

  UPDATE public.course_offerings SET vacancies_available = vacancies_available + 1
   WHERE id = v_res.course_offering_id;
  UPDATE public.scholarships SET used_count = GREATEST(used_count - 1, 0)
   WHERE id = v_res.scholarship_id;

  INSERT INTO public.notifications(user_id, type, title, message, link)
  VALUES (v_res.user_id, 'REFUND_PROCESSED',
    'Reembolso processado 💸',
    'O valor da reserva ' || v_res.reservation_code || ' foi reembolsado. ' || COALESCE(p_reason,''),
    '/reservas/' || v_res.id::text);

  RETURN v_refund;
END $$;

GRANT EXECUTE ON FUNCTION public.complete_refund(uuid, text, text) TO authenticated;
