
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT jsonb_build_object(
    'institutions_total', (SELECT count(*) FROM public.institutions),
    'institutions_pending', (SELECT count(*) FROM public.institutions WHERE status='PENDING'),
    'institutions_approved', (SELECT count(*) FROM public.institutions WHERE status='APPROVED'),
    'institutions_suspended', (SELECT count(*) FROM public.institutions WHERE status='SUSPENDED'),
    'applications_pending', (SELECT count(*) FROM public.institution_applications WHERE status IN ('SUBMITTED','UNDER_REVIEW','NEEDS_INFO')),
    'applications_recent', (SELECT count(*) FROM public.institution_applications WHERE submitted_at > now() - interval '7 days'),
    'scholarships_active', (SELECT count(*) FROM public.scholarships WHERE is_active=true),
    'scholarships_total', (SELECT count(*) FROM public.scholarships),
    'students_total', (SELECT count(*) FROM public.user_roles WHERE role='STUDENT'),
    'reservations_total', (SELECT count(*) FROM public.reservations),
    'reservations_pending', (SELECT count(*) FROM public.reservations WHERE status IN ('RESERVED','PAYMENT_PENDING')),
    'reservations_confirmed', (SELECT count(*) FROM public.reservations WHERE status='CONFIRMED'),
    'reservations_expired', (SELECT count(*) FROM public.reservations WHERE status='EXPIRED'),
    'gmv_paid', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts WHERE status='PAID'),
    'payments_count', (SELECT count(*) FROM public.payment_attempts WHERE status='PAID'),
    'recent_signups', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'recent_reservations', (SELECT count(*) FROM public.reservations WHERE created_at > now() - interval '7 days')
  ) INTO v;

  RETURN v::json;
END $function$;
