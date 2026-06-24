
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'READY',
  payload JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.data_export_requests TO authenticated;
GRANT ALL ON public.data_export_requests TO service_role;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own exports" ON public.data_export_requests FOR SELECT USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Users create own exports" ON public.data_export_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  processed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, DELETE ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deletion" ON public.account_deletion_requests FOR ALL USING (user_id = auth.uid() OR public.is_platform_admin()) WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE TABLE IF NOT EXISTS public.consent_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  granted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.consent_log TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.consent_log_id_seq TO anon, authenticated;
GRANT SELECT ON public.consent_log TO authenticated;
GRANT ALL ON public.consent_log TO service_role;
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log consent" ON public.consent_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Users see own consent" ON public.consent_log FOR SELECT USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.export_my_data() RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT jsonb_build_object(
    'exported_at', now(),
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.user_id = v_uid),
    'reservations', COALESCE((SELECT jsonb_agg(row_to_json(r)) FROM public.reservations r WHERE r.user_id = v_uid), '[]'::jsonb),
    'favorites', COALESCE((SELECT jsonb_agg(row_to_json(f)) FROM public.favorites f WHERE f.user_id = v_uid), '[]'::jsonb),
    'reviews', COALESCE((SELECT jsonb_agg(row_to_json(rv)) FROM public.institution_reviews rv WHERE rv.user_id = v_uid), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(jsonb_build_object('doc_type', d.doc_type, 'file_name', d.file_name, 'status', d.status, 'created_at', d.created_at))
                            FROM public.enrollment_documents d WHERE d.user_id = v_uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(row_to_json(n)) FROM public.notifications n WHERE n.user_id = v_uid), '[]'::jsonb),
    'consents', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM public.consent_log c WHERE c.user_id = v_uid), '[]'::jsonb)
  ) INTO v;
  INSERT INTO public.data_export_requests (user_id, status, payload, completed_at)
  VALUES (v_uid, 'READY', v, now());
  RETURN v::json;
END $$;

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason TEXT) RETURNS public.account_deletion_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req public.account_deletion_requests%ROWTYPE; v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  INSERT INTO public.account_deletion_requests (user_id, reason)
  VALUES (v_uid, NULLIF(p_reason,''))
  ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason, requested_at = now(), scheduled_for = now() + interval '30 days', status = 'PENDING'
  RETURNING * INTO v_req;
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (v_uid, 'ACCOUNT_DELETION_REQUESTED', 'Exclusão de conta agendada',
    'Sua conta será excluída em 30 dias. Faça login antes desse prazo para cancelar.');
  RETURN v_req;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion() RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.account_deletion_requests WHERE user_id = auth.uid();
END $$;
