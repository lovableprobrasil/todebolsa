
CREATE OR REPLACE FUNCTION public.institution_finance_overview(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean;
  v_gross numeric := 0;
  v_refunds numeric := 0;
  v_payments_count integer := 0;
  v_refunds_count integer := 0;
  v_avg numeric := 0;
  v_rev_7d numeric := 0;
  v_rev_30d numeric := 0;
  v_pending integer := 0;
  v_monthly jsonb := '[]'::jsonb;
  v_recent jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT
    public.has_role(v_uid, 'PLATFORM_ADMIN')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_uid
        AND ur.role = 'INSTITUTION_ADMIN'
        AND ur.institution_id = p_institution_id
    )
  INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    COALESCE(SUM(r.amount_paid), 0),
    COUNT(*)
  INTO v_gross, v_payments_count
  FROM public.reservations r
  WHERE r.institution_id = p_institution_id
    AND r.payment_status = 'PAID';

  SELECT
    COALESCE(SUM(rf.amount), 0),
    COUNT(*)
  INTO v_refunds, v_refunds_count
  FROM public.refunds rf
  JOIN public.reservations r ON r.id = rf.reservation_id
  WHERE r.institution_id = p_institution_id
    AND rf.status = 'COMPLETED';

  IF v_payments_count > 0 THEN
    v_avg := v_gross / v_payments_count;
  END IF;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_rev_7d
  FROM public.reservations
  WHERE institution_id = p_institution_id
    AND payment_status = 'PAID'
    AND updated_at >= now() - interval '7 days';

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_rev_30d
  FROM public.reservations
  WHERE institution_id = p_institution_id
    AND payment_status = 'PAID'
    AND updated_at >= now() - interval '30 days';

  SELECT COUNT(*) INTO v_pending
  FROM public.reservations
  WHERE institution_id = p_institution_id
    AND payment_status = 'PENDING'
    AND status = 'PENDING';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'month', to_char(m, 'YYYY-MM'),
    'revenue', COALESCE(rev, 0),
    'payments', COALESCE(cnt, 0)
  ) ORDER BY m), '[]'::jsonb)
  INTO v_monthly
  FROM (
    SELECT date_trunc('month', d)::date AS m
    FROM generate_series(date_trunc('month', now()) - interval '11 months',
                         date_trunc('month', now()),
                         interval '1 month') d
  ) months
  LEFT JOIN LATERAL (
    SELECT SUM(amount_paid) AS rev, COUNT(*) AS cnt
    FROM public.reservations
    WHERE institution_id = p_institution_id
      AND payment_status = 'PAID'
      AND date_trunc('month', updated_at) = months.m
  ) r ON true;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.updated_at DESC), '[]'::jsonb)
  INTO v_recent
  FROM (
    SELECT r.id, r.reservation_code, r.amount_paid, r.payment_method,
           r.updated_at, s.title AS scholarship_title
    FROM public.reservations r
    LEFT JOIN public.scholarships s ON s.id = r.scholarship_id
    WHERE r.institution_id = p_institution_id
      AND r.payment_status = 'PAID'
    ORDER BY r.updated_at DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'gross_revenue', v_gross,
    'refunds_total', v_refunds,
    'net_revenue', v_gross - v_refunds,
    'payments_count', v_payments_count,
    'refunds_count', v_refunds_count,
    'avg_ticket', v_avg,
    'revenue_7d', v_rev_7d,
    'revenue_30d', v_rev_30d,
    'pending_payments', v_pending,
    'monthly', v_monthly,
    'recent', v_recent
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.institution_finance_overview(uuid) TO authenticated;
