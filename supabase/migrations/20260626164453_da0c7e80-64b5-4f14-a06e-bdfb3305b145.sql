CREATE OR REPLACE FUNCTION public.revoke_user_role(p_user_id uuid, p_role app_role, p_institution_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_roles
   WHERE user_id = p_user_id AND role = p_role
     AND (p_institution_id IS NULL OR institution_id = p_institution_id);
END $function$;