
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
  v_is_service boolean := (auth.role() = 'service_role');
BEGIN
  IF NOT v_is_service AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.payment_status NOT IN ('PAID') THEN
    -- Reentrância: se já refunded e o webhook chegou de novo, retorna o último refund sem erro.
    SELECT * INTO v_refund FROM public.refunds
      WHERE reservation_id = p_reservation_id
      ORDER BY processed_at DESC LIMIT 1;
    IF FOUND THEN RETURN v_refund; END IF;
    RAISE EXCEPTION 'Apenas reservas pagas podem ser reembolsadas.';
  END IF;

  SELECT * INTO v_pay FROM public.payment_attempts
    WHERE reservation_id = p_reservation_id AND status = 'PAID'
    ORDER BY paid_at DESC NULLS LAST LIMIT 1;

  SELECT * INTO v_refund FROM public.refunds
   WHERE (p_stripe_refund_id IS NOT NULL AND stripe_refund_id = p_stripe_refund_id)
      OR (reservation_id = p_reservation_id AND status = 'REQUESTED')
   ORDER BY status DESC LIMIT 1;

  IF FOUND THEN
    UPDATE public.refunds
      SET status = 'PROCESSED',
          reason = COALESCE(NULLIF(p_reason,''), reason),
          stripe_refund_id = COALESCE(p_stripe_refund_id, stripe_refund_id),
          processed_by = COALESCE(auth.uid(), processed_by),
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
