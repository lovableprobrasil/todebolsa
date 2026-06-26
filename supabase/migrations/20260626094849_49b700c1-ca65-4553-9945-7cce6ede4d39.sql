
-- 1) blog_posts: require status='PUBLISHED' in public read policy
DROP POLICY IF EXISTS "public read published posts" ON public.blog_posts;
CREATE POLICY "public read published posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND status = 'PUBLISHED'::news_status);

-- 2) institutions: column-level grants for anon (exclude cnpj, email, phone)
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (
  id, slug, trade_name, legal_name, description, logo_url, cover_url,
  website, mec_code, rating, status, is_featured, created_at, updated_at,
  rating_avg, rating_count
) ON public.institutions TO anon;

GRANT SELECT ON public.institutions TO authenticated;
