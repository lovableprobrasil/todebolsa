CREATE OR REPLACE FUNCTION public.is_platform_sales()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'PLATFORM_SALES'::public.app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "admins manage posts" ON public.blog_posts;
CREATE POLICY "admins manage posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin views all applications" ON public.institution_applications;
CREATE POLICY "Platform admin views all applications"
ON public.institution_applications
FOR SELECT
TO authenticated
USING (public.is_platform_admin() OR public.is_platform_sales());

DROP POLICY IF EXISTS "Admin views app docs" ON public.institution_application_documents;
CREATE POLICY "Admin views app docs"
ON public.institution_application_documents
FOR SELECT
TO authenticated
USING (public.is_platform_admin() OR public.is_platform_sales());

DROP POLICY IF EXISTS "Applicant reads own thread" ON public.institution_application_messages;
CREATE POLICY "Applicant reads own thread"
ON public.institution_application_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_applications a
    WHERE a.id = institution_application_messages.application_id
      AND a.user_id = auth.uid()
  )
  OR public.is_platform_admin()
  OR public.is_platform_sales()
);

DROP POLICY IF EXISTS "Participants post in thread" ON public.institution_application_messages;
CREATE POLICY "Participants post in thread"
ON public.institution_application_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.institution_applications a
      WHERE a.id = institution_application_messages.application_id
        AND a.user_id = auth.uid()
    )
    OR public.is_platform_admin()
    OR public.is_platform_sales()
  )
);