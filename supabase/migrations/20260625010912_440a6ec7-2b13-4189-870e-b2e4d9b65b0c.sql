CREATE OR REPLACE FUNCTION public.admin_list_institution_applications()
RETURNS TABLE (
  id uuid,
  status public.institution_application_status,
  trade_name text,
  legal_name text,
  cnpj text,
  city text,
  state text,
  responsible_name text,
  responsible_email text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone,
  high_potential boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.status,
    a.trade_name,
    a.legal_name,
    a.cnpj,
    a.city,
    a.state,
    a.responsible_name,
    a.responsible_email,
    a.submitted_at,
    a.created_at,
    a.high_potential
  FROM public.institution_applications a
  WHERE public.is_platform_admin(auth.uid())
     OR public.has_role(auth.uid(), 'PLATFORM_SALES'::public.app_role)
  ORDER BY a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_institution_applications() TO authenticated;