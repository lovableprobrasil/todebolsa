
-- =========================================================
-- NEWS CATEGORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  color text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_categories TO anon, authenticated;
GRANT ALL ON public.news_categories TO service_role;

ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_categories public read"
  ON public.news_categories FOR SELECT
  USING (true);

CREATE POLICY "news_categories admin write"
  ON public.news_categories FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Seed default categories
INSERT INTO public.news_categories (slug, name, description, color, sort_order) VALUES
  ('bolsas', 'Bolsas de Estudo', 'Tudo sobre bolsas, descontos e financiamento educacional.', '#F97316', 1),
  ('carreira', 'Carreira', 'Profissões em alta, mercado de trabalho e desenvolvimento profissional.', '#0EA5E9', 2),
  ('educacao', 'Educação', 'Tendências, políticas educacionais e novidades do ensino superior e técnico.', '#10B981', 3),
  ('enem-vestibular', 'ENEM e Vestibular', 'Dicas, cronogramas e estratégias para o ENEM e vestibulares.', '#8B5CF6', 4),
  ('financeiro', 'Financeiro', 'Como pagar a faculdade, FIES, ProUni e organização financeira.', '#EAB308', 5)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- NEWS POST VERSIONS (history)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.news_post_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  title text NOT NULL,
  subtitle text,
  excerpt text,
  content text,
  cover_url text,
  status text,
  snapshot jsonb NOT NULL,
  change_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, version_number)
);

GRANT SELECT, INSERT ON public.news_post_versions TO authenticated;
GRANT ALL ON public.news_post_versions TO service_role;

ALTER TABLE public.news_post_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_versions admin read"
  ON public.news_post_versions FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "news_versions admin insert"
  ON public.news_post_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS news_post_versions_post_idx
  ON public.news_post_versions (post_id, version_number DESC);

-- =========================================================
-- TRIGGER: snapshot on update
-- =========================================================
CREATE OR REPLACE FUNCTION public.news_create_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version int;
BEGIN
  -- only snapshot on relevant changes
  IF TG_OP = 'UPDATE' AND
     OLD.title IS NOT DISTINCT FROM NEW.title AND
     OLD.subtitle IS NOT DISTINCT FROM NEW.subtitle AND
     OLD.content IS NOT DISTINCT FROM NEW.content AND
     OLD.excerpt IS NOT DISTINCT FROM NEW.excerpt AND
     OLD.cover_url IS NOT DISTINCT FROM NEW.cover_url AND
     OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
  FROM public.news_post_versions
  WHERE post_id = OLD.id;

  INSERT INTO public.news_post_versions (
    post_id, version_number, title, subtitle, excerpt, content, cover_url, status, snapshot, created_by
  ) VALUES (
    OLD.id, next_version, OLD.title, OLD.subtitle, OLD.excerpt, OLD.content,
    OLD.cover_url, OLD.status::text, to_jsonb(OLD), auth.uid()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS news_create_version_trg ON public.blog_posts;
CREATE TRIGGER news_create_version_trg
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.news_create_version();

-- =========================================================
-- SCHEDULED PUBLISH FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.publish_scheduled_news()
RETURNS TABLE (published_id uuid, published_slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.blog_posts
     SET status = 'PUBLISHED',
         is_published = true,
         published_at = COALESCE(published_at, now()),
         scheduled_at = NULL
   WHERE status = 'SCHEDULED'
     AND scheduled_at IS NOT NULL
     AND scheduled_at <= now()
  RETURNING id, slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_scheduled_news() TO anon, authenticated, service_role;
