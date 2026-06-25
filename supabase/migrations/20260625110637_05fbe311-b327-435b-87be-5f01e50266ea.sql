
-- 1) Institutions: lock down sensitive columns from anon at policy level (defense in depth on top of column grants)
DROP POLICY IF EXISTS "public read approved institutions" ON public.institutions;

CREATE POLICY "anon read public institution columns"
  ON public.institutions
  FOR SELECT
  TO anon
  USING (status = 'APPROVED'::institution_status);

CREATE POLICY "authenticated read approved institutions"
  ON public.institutions
  FOR SELECT
  TO authenticated
  USING (status = 'APPROVED'::institution_status);

-- Re-assert column-level grants (idempotent)
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (id, slug, trade_name, legal_name, description, logo_url, cover_url, website, mec_code, rating, status, is_featured, created_at, updated_at, rating_avg, rating_count)
  ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;

-- 2) referral_payouts: allow platform admins to DELETE (LGPD/account deletion)
DROP POLICY IF EXISTS "Admins delete payouts" ON public.referral_payouts;
CREATE POLICY "Admins delete payouts"
  ON public.referral_payouts
  FOR DELETE
  USING (public.is_platform_admin());

-- 3) user_roles: explicit restrictive write policies (admin-only) to prevent privilege escalation
DROP POLICY IF EXISTS "only admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "only admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "only admins delete roles" ON public.user_roles;

CREATE POLICY "only admins insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "only admins update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "only admins delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());
