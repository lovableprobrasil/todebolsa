REVOKE EXECUTE ON FUNCTION public.admin_list_institution_applications() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_institution_applications() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_institution_applications() TO authenticated;