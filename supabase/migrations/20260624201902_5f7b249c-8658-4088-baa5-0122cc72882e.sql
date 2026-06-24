
-- Refund status enum
DO $$ BEGIN
  CREATE TYPE public.refund_status AS ENUM ('REQUESTED','PROCESSED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  payment_attempt_id UUID REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status public.refund_status NOT NULL DEFAULT 'PROCESSED',
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refunds"
  ON public.refunds FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER set_refunds_updated_at BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_refunds_reservation ON public.refunds(reservation_id);
CREATE INDEX IF NOT EXISTS idx_refunds_processed_at ON public.refunds(processed_at DESC);

-- Request refund (admin only)
CREATE OR REPLACE FUNCTION public.request_refund(p_reservation_id UUID, p_reason TEXT)
RETURNS public.refunds
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_pay public.payment_attempts%ROWTYPE;
  v_refund public.refunds%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.payment_status <> 'PAID' THEN
    RAISE EXCEPTION 'Apenas reservas pagas podem ser reembolsadas.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.refunds WHERE reservation_id = p_reservation_id AND status = 'PROCESSED') THEN
    RAISE EXCEPTION 'Esta reserva já foi reembolsada.';
  END IF;

  SELECT * INTO v_pay FROM public.payment_attempts
    WHERE reservation_id = p_reservation_id AND status = 'PAID'
    ORDER BY paid_at DESC NULLS LAST LIMIT 1;

  INSERT INTO public.refunds (reservation_id, payment_attempt_id, amount, reason, status, processed_by)
  VALUES (p_reservation_id, v_pay.id, v_res.amount_paid, NULLIF(p_reason,''), 'PROCESSED', auth.uid())
  RETURNING * INTO v_refund;

  UPDATE public.payment_attempts SET status = 'REFUNDED' WHERE id = v_pay.id;

  UPDATE public.reservations
    SET status = 'CANCELLED', payment_status = 'REFUNDED', expires_at = NULL
  WHERE id = p_reservation_id;

  -- Return vacancy
  UPDATE public.course_offerings SET vacancies_available = vacancies_available + 1
    WHERE id = v_res.course_offering_id;
  UPDATE public.scholarships SET used_count = GREATEST(used_count - 1, 0)
    WHERE id = v_res.scholarship_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_res.user_id, 'REFUND_PROCESSED',
    'Reembolso processado 💸',
    'O valor da reserva ' || v_res.reservation_code || ' foi reembolsado. ' || COALESCE(p_reason,''),
    '/reservas/' || v_res.id::text);

  RETURN v_refund;
END $$;

-- Finance overview
CREATE OR REPLACE FUNCTION public.finance_overview()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT jsonb_build_object(
    'gross_revenue', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts WHERE status='PAID'),
    'refunds_total', (SELECT COALESCE(SUM(amount),0) FROM public.refunds WHERE status='PROCESSED'),
    'net_revenue', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts WHERE status='PAID')
                  - (SELECT COALESCE(SUM(amount),0) FROM public.refunds WHERE status='PROCESSED'),
    'payments_count', (SELECT count(*) FROM public.payment_attempts WHERE status='PAID'),
    'refunds_count', (SELECT count(*) FROM public.refunds WHERE status='PROCESSED'),
    'avg_ticket', (SELECT COALESCE(AVG(amount),0) FROM public.payment_attempts WHERE status='PAID'),
    'revenue_30d', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts
                    WHERE status='PAID' AND paid_at > now() - interval '30 days'),
    'revenue_7d', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts
                   WHERE status='PAID' AND paid_at > now() - interval '7 days'),
    'pending_payments', (SELECT count(*) FROM public.reservations
                         WHERE status IN ('PAYMENT_PENDING','RESERVED') AND payment_status='PENDING'),
    'monthly', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.month), '[]'::jsonb) FROM (
        SELECT to_char(date_trunc('month', paid_at),'YYYY-MM') AS month,
               SUM(amount) AS revenue,
               count(*) AS payments
        FROM public.payment_attempts
        WHERE status='PAID' AND paid_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) t
    )
  ) INTO v;
  RETURN v::json;
END $$;

-- Revenue by institution (internal report only — NOT a payout)
CREATE OR REPLACE FUNCTION public.finance_revenue_by_institution()
RETURNS TABLE(institution_id UUID, trade_name TEXT, payments_count BIGINT, gross NUMERIC, refunds NUMERIC, net NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
    SELECT i.id, i.trade_name,
      count(pa.*)::bigint AS payments_count,
      COALESCE(SUM(pa.amount),0) AS gross,
      COALESCE((SELECT SUM(r.amount) FROM public.refunds r
                JOIN public.reservations rs ON rs.id = r.reservation_id
                WHERE rs.institution_id = i.id AND r.status='PROCESSED'),0) AS refunds,
      COALESCE(SUM(pa.amount),0)
        - COALESCE((SELECT SUM(r.amount) FROM public.refunds r
                    JOIN public.reservations rs ON rs.id = r.reservation_id
                    WHERE rs.institution_id = i.id AND r.status='PROCESSED'),0) AS net
    FROM public.institutions i
    LEFT JOIN public.reservations rs ON rs.institution_id = i.id
    LEFT JOIN public.payment_attempts pa ON pa.reservation_id = rs.id AND pa.status='PAID'
    GROUP BY i.id, i.trade_name
    HAVING count(pa.*) > 0
    ORDER BY gross DESC;
END $$;

-- Institution's view of paid leads received (no money exposed)
CREATE OR REPLACE FUNCTION public.institution_paid_leads_report(p_institution_id UUID)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_institution_admin(auth.uid(), p_institution_id)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT jsonb_build_object(
    'paid_total', (SELECT count(*) FROM public.reservations
                   WHERE institution_id = p_institution_id AND payment_status='PAID'),
    'awaiting_enrollment', (SELECT count(*) FROM public.reservations
                            WHERE institution_id = p_institution_id AND payment_status='PAID'
                              AND status IN ('CONFIRMED','AWAITING_ENROLLMENT','UNDER_REVIEW')),
    'enrollment_approved', (SELECT count(*) FROM public.reservations
                            WHERE institution_id = p_institution_id AND status='ENROLLMENT_APPROVED'),
    'enrollment_rejected', (SELECT count(*) FROM public.reservations
                            WHERE institution_id = p_institution_id AND status='ENROLLMENT_REJECTED'),
    'paid_30d', (SELECT count(*) FROM public.reservations
                 WHERE institution_id = p_institution_id AND payment_status='PAID'
                   AND updated_at > now() - interval '30 days')
  ) INTO v;
  RETURN v::json;
END $$;
