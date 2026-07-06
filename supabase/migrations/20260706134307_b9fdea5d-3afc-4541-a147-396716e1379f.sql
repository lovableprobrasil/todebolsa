ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS area TEXT;
CREATE INDEX IF NOT EXISTS idx_courses_area ON public.courses(area);