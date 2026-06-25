
DO $$ BEGIN
  CREATE TYPE public.news_status AS ENUM ('DRAFT','IN_REVIEW','SCHEDULED','PUBLISHED','ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS main_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS image_credit text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS status public.news_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_warnings text[] NOT NULL DEFAULT '{}';

UPDATE public.blog_posts SET status = 'PUBLISHED' WHERE is_published = true AND status = 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(featured) WHERE featured = true;

CREATE TABLE IF NOT EXISTS public.news_ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_type text NOT NULL,
  input_payload jsonb,
  output_payload jsonb,
  model_provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_ai_generations TO authenticated;
GRANT ALL ON public.news_ai_generations TO service_role;
ALTER TABLE public.news_ai_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage ai generations" ON public.news_ai_generations;
CREATE POLICY "admins manage ai generations" ON public.news_ai_generations
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TABLE IF NOT EXISTS public.news_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL DEFAULT 'cover',
  prompt text,
  style text,
  aspect_ratio text,
  alt_text text,
  selected boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_images TO authenticated;
GRANT SELECT ON public.news_images TO anon;
GRANT ALL ON public.news_images TO service_role;
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage news images" ON public.news_images;
CREATE POLICY "admins manage news images" ON public.news_images
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "public can view news images" ON public.news_images;
CREATE POLICY "public can view news images" ON public.news_images
  FOR SELECT TO anon, authenticated USING (true);
