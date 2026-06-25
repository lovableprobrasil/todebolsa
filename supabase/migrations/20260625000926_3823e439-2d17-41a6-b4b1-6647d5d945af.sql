
-- 1. Institutions: hide cnpj/email/phone from anonymous public reads.
-- Keep the row-level public-read policy but revoke column SELECT for anon on sensitive fields.
-- Authenticated users (and institution admins via their own policy) keep full access.
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (id, slug, trade_name, legal_name, description, logo_url, cover_url,
              website, mec_code, rating, status, is_featured, created_at, updated_at,
              rating_avg, rating_count) ON public.institutions TO anon;

-- 2. Refunds: let users see their own refunds.
CREATE POLICY "Users read own refunds" ON public.refunds
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = refunds.reservation_id AND r.user_id = auth.uid()
  ));

-- 3. Storage: add UPDATE policy on enrollment-documents matching INSERT/SELECT ownership.
CREATE POLICY "enroll_docs_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'enrollment-documents'
    AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_platform_admin())
  )
  WITH CHECK (
    bucket_id = 'enrollment-documents'
    AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_platform_admin())
  );

-- 4. institution_applications: restrict direct UPDATE to PLATFORM_ADMIN only.
-- PLATFORM_SALES must go through SECURITY DEFINER RPCs (set_application_status,
-- assign_application_sales, post_application_message, toggle_application_high_potential,
-- set_application_internal_notes) which already enforce sales scope.
DROP POLICY IF EXISTS "Platform admin updates applications" ON public.institution_applications;
CREATE POLICY "Platform admin updates applications" ON public.institution_applications
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
