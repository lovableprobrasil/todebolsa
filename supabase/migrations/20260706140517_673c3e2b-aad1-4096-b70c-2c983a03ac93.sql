
REVOKE ALL ON FUNCTION public.institution_save_scholarship(uuid, uuid, text, text, text, text, text, uuid, numeric, text, numeric, int, timestamptz, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.institution_save_scholarship(uuid, uuid, text, text, text, text, text, uuid, numeric, text, numeric, int, timestamptz, text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.institution_delete_scholarship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.institution_delete_scholarship(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_ead_unit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_ead_unit(uuid) TO authenticated;
