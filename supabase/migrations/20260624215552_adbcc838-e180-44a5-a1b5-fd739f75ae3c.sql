
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  path TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read events"
  ON public.analytics_events FOR SELECT
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON public.analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);

CREATE OR REPLACE FUNCTION public.track_event(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_session_id TEXT,
  p_path TEXT,
  p_referrer TEXT,
  p_metadata JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.analytics_events
    (event_type, entity_type, entity_id, user_id, session_id, path, referrer, metadata)
  VALUES
    (p_event_type, NULLIF(p_entity_type,''), p_entity_id, auth.uid(),
     NULLIF(p_session_id,''), NULLIF(p_path,''), NULLIF(p_referrer,''),
     COALESCE(p_metadata, '{}'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.funnel_overview(p_days INT DEFAULT 30)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  WITH
    period AS (SELECT now() - (p_days || ' days')::interval AS since),
    visits AS (
      SELECT COUNT(DISTINCT session_id) AS unique_sessions,
             COUNT(*) AS pageviews
      FROM public.analytics_events, period
      WHERE event_type = 'pageview' AND created_at >= since
    ),
    scholarship_views AS (
      SELECT COUNT(*) AS total,
             COUNT(DISTINCT entity_id) AS unique_scholarships
      FROM public.analytics_events, period
      WHERE event_type = 'scholarship_view' AND created_at >= since
    ),
    reservations_cte AS (
      SELECT COUNT(*) AS reservations_count,
             COUNT(*) FILTER (WHERE payment_status='PAID') AS paid_count,
             COUNT(*) FILTER (WHERE status='ENROLLMENT_APPROVED') AS enrolled_count
      FROM public.reservations, period
      WHERE created_at >= since
    ),
    top_inst AS (
      SELECT i.trade_name, COUNT(*) AS views
      FROM public.analytics_events e
      JOIN public.institutions i ON i.id = e.entity_id
      , period
      WHERE e.event_type = 'institution_view' AND e.created_at >= since
      GROUP BY i.trade_name
      ORDER BY views DESC LIMIT 5
    ),
    daily AS (
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT session_id) AS sessions,
             COUNT(*) AS events
      FROM public.analytics_events, period
      WHERE created_at >= since
      GROUP BY 1 ORDER BY 1
    )
  SELECT jsonb_build_object(
    'period_days', p_days,
    'visits', (SELECT row_to_json(visits) FROM visits),
    'scholarship_views', (SELECT row_to_json(scholarship_views) FROM scholarship_views),
    'reservations', (SELECT row_to_json(reservations_cte) FROM reservations_cte),
    'top_institutions', COALESCE((SELECT jsonb_agg(row_to_json(top_inst)) FROM top_inst), '[]'::jsonb),
    'daily', COALESCE((SELECT jsonb_agg(row_to_json(daily)) FROM daily), '[]'::jsonb)
  ) INTO v;
  RETURN v::json;
END $$;
