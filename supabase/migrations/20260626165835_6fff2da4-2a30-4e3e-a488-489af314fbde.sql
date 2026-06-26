
CREATE OR REPLACE FUNCTION public.checkout_finalize(
  p_session_token text,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_session public.checkout_sessions%ROWTYPE;
  v_sch public.scholarships%ROWTYPE;
  v_off public.course_offerings%ROWTYPE;
  v_inst_id uuid;
  v_code text;
  v_res_id uuid;
  v_fee numeric;
  v_rule_id uuid;
BEGIN
  SELECT * INTO v_session FROM public.checkout_sessions
    WHERE session_token = p_session_token AND status='ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida ou já convertida'; END IF;
  IF v_session.reservation_id IS NOT NULL THEN RETURN v_session.reservation_id; END IF;

  SELECT * INTO v_sch FROM public.scholarships WHERE id = v_session.scholarship_id FOR UPDATE;
  IF NOT FOUND OR NOT v_sch.is_active THEN RAISE EXCEPTION 'Bolsa indisponível'; END IF;
  SELECT * INTO v_off FROM public.course_offerings WHERE id = v_sch.course_offering_id FOR UPDATE;
  IF v_off.vacancies_available IS NULL OR v_off.vacancies_available <= 0 THEN RAISE EXCEPTION 'Sem vagas'; END IF;
  SELECT u.institution_id INTO v_inst_id FROM public.institution_units u WHERE u.id = v_off.institution_unit_id;
  SELECT amount, rule_id INTO v_fee, v_rule_id FROM public.calculate_reservation_fee(v_session.scholarship_id);
  v_code := public.gen_reservation_code();

  INSERT INTO public.reservations(
    user_id, scholarship_id, course_offering_id, institution_id,
    reservation_code, status, payment_status, amount_paid, expires_at,
    pricing_rule_id, checkout_session_id, payment_method, installments,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term
  ) VALUES (
    p_user_id, v_sch.id, v_off.id, v_inst_id,
    v_code, 'PAYMENT_PENDING', 'PENDING', COALESCE(v_session.amount_charged, v_fee),
    now() + interval '48 hours', v_rule_id, v_session.id,
    v_session.payment_method, COALESCE(v_session.installments, 1),
    v_session.utm_source, v_session.utm_medium, v_session.utm_campaign,
    v_session.utm_content, v_session.utm_term
  ) RETURNING id INTO v_res_id;

  UPDATE public.scholarships SET used_count = used_count + 1 WHERE id = v_sch.id;
  UPDATE public.course_offerings SET vacancies_available = vacancies_available - 1 WHERE id = v_off.id;

  UPDATE public.checkout_sessions
    SET reservation_id = v_res_id, user_id = p_user_id,
        status='CONVERTED', current_step='DONE'
    WHERE id = v_session.id;

  INSERT INTO public.checkout_events(checkout_session_id, event_type, metadata)
    VALUES (v_session.id, 'payment_confirmed',
            jsonb_build_object('reservation_id', v_res_id, 'method', v_session.payment_method));

  INSERT INTO public.notifications(user_id, type, title, message, link)
  VALUES (p_user_id, 'RESERVATION_CREATED',
    'Bolsa reservada! Código ' || v_code,
    'Sua bolsa foi reservada. Acesse para acompanhar e baixar sua Carta de Apresentação.',
    '/reservas/' || v_res_id::text);

  RETURN v_res_id;
END $$;

GRANT EXECUTE ON FUNCTION public.checkout_finalize(text, uuid) TO service_role;
