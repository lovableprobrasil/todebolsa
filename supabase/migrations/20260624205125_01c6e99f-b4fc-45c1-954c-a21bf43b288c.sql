
-- 1. Hide sensitive institution columns from anonymous (public) callers
REVOKE SELECT (cnpj, legal_name) ON public.institutions FROM anon;

-- 2. Allow institution admins (and platform admins) to read enrollments at their institution
CREATE POLICY "inst admin reads enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  public.is_institution_admin(auth.uid(), institution_id)
);
