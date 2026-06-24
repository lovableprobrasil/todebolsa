
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='PLATFORM_ADMIN') THEN
    RAISE EXCEPTION 'Já existe um administrador da plataforma.';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'PLATFORM_ADMIN')
  ON CONFLICT DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
