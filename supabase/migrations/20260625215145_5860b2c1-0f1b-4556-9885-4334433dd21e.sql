
DROP POLICY IF EXISTS "news-images public read" ON storage.objects;
DROP POLICY IF EXISTS "news-images admin write" ON storage.objects;
DROP POLICY IF EXISTS "news-images admin update" ON storage.objects;
DROP POLICY IF EXISTS "news-images admin delete" ON storage.objects;

CREATE POLICY "news-images public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news-images');

CREATE POLICY "news-images admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news-images' AND public.is_platform_admin());

CREATE POLICY "news-images admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'news-images' AND public.is_platform_admin());

CREATE POLICY "news-images admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'news-images' AND public.is_platform_admin());
