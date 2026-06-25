GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_applications TO authenticated;
GRANT ALL ON public.institution_applications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_application_messages TO authenticated;
GRANT ALL ON public.institution_application_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_application_documents TO authenticated;
GRANT ALL ON public.institution_application_documents TO service_role;