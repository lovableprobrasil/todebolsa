
-- 1) Fix function search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_code TEXT;
BEGIN
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END $function$;

CREATE OR REPLACE FUNCTION public.set_referral_code_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN NEW.referral_code := public.generate_referral_code(); END IF;
  RETURN NEW;
END $function$;

-- 2) Restrict user_badges to owner-only SELECT (plus admins)
DROP POLICY IF EXISTS "Badges are public" ON public.user_badges;
CREATE POLICY "Users read own badges" ON public.user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

-- 3) Restrict anon access to sensitive institution columns by revoking column-level SELECT
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (
  id, slug, trade_name, legal_name, website, description, logo_url, cover_url,
  status, is_featured, rating_avg, rating_count, created_at, updated_at
) ON public.institutions TO anon;
-- authenticated keeps full SELECT (existing GRANTs unchanged)

-- 4) Tighten always-true INSERT policies to scope to the acting user/session
DROP POLICY IF EXISTS "Anyone can log consent" ON public.consent_log;
CREATE POLICY "Log consent for self or session" ON public.consent_log
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Anyone can insert events" ON public.analytics_events;
CREATE POLICY "Insert events for self or session" ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );
