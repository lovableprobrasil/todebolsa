
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reading_time_minutes integer;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts (published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON public.blog_posts (view_count DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON public.blog_posts (is_featured) WHERE is_featured = true;

-- View tracking (público)
CREATE OR REPLACE FUNCTION public.increment_news_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = _slug AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_news_view(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_news_view(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_news_share(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET share_count = share_count + 1
  WHERE slug = _slug AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_news_share(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_news_share(text) TO anon, authenticated;

-- Cálculo automático do tempo de leitura (200 ppm)
CREATE OR REPLACE FUNCTION public.compute_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  word_count int;
BEGIN
  IF NEW.content IS NOT NULL THEN
    word_count := array_length(regexp_split_to_array(regexp_replace(NEW.content, '<[^>]+>', ' ', 'g'), '\s+'), 1);
    NEW.reading_time_minutes := GREATEST(1, COALESCE(word_count, 0) / 200);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_reading_time ON public.blog_posts;
CREATE TRIGGER trg_blog_reading_time
BEFORE INSERT OR UPDATE OF content ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.compute_reading_time();

-- Top posts (últimos 7 dias por views)
CREATE OR REPLACE FUNCTION public.news_top_posts(_days int DEFAULT 7, _limit int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  cover_url text,
  category text,
  view_count int,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, slug, title, cover_url, category, view_count, published_at
  FROM public.blog_posts
  WHERE is_published = true
    AND published_at > now() - (_days || ' days')::interval
  ORDER BY view_count DESC, published_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.news_top_posts(int, int) TO anon, authenticated;
