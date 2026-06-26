
-- Enums
DO $$ BEGIN
  CREATE TYPE public.checkout_step AS ENUM ('DATA','SCHOLARSHIP','REVIEW','PAYMENT','DONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.checkout_status AS ENUM ('ACTIVE','ABANDONED','CONVERTED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('PIX','BOLETO','CARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS checkout_session_id uuid,
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method,
  ADD COLUMN IF NOT EXISTS installments smallint DEFAULT 1,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text;

-- Extend pricing rules (payment configuration)
ALTER TABLE public.marketplace_pricing_rules
  ADD COLUMN IF NOT EXISTS allow_pix boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_boleto boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_card boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_installments smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_installment_amount numeric(10,2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS interest_rate_pct numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pix_expiration_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS boleto_due_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS reserve_before_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_ttl_minutes integer NOT NULL DEFAULT 60;

-- checkout_sessions
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  current_step public.checkout_step NOT NULL DEFAULT 'DATA',
  status public.checkout_status NOT NULL DEFAULT 'ACTIVE',
  personal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  address_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_method public.payment_method,
  installments smallint DEFAULT 1,
  amount_charged numeric(10,2),
  pricing_rule_id uuid REFERENCES public.marketplace_pricing_rules(id),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  ip_address inet, user_agent text,
  abandonment_email_sent_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON public.checkout_sessions(status, updated_at);

GRANT SELECT, INSERT, UPDATE ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_checkout_sessions" ON public.checkout_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- checkout_acceptances
CREATE TABLE IF NOT EXISTS public.checkout_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_email text,
  lead_name text,
  lead_cpf text,
  term_kind text NOT NULL, -- TERMS | PRIVACY | SCHOLARSHIP_CONDITIONS | CONTRACT
  term_version text NOT NULL DEFAULT 'v1',
  ip_address inet,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acceptances_session ON public.checkout_acceptances(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_acceptances_user ON public.checkout_acceptances(user_id);

GRANT SELECT, INSERT ON public.checkout_acceptances TO authenticated;
GRANT ALL ON public.checkout_acceptances TO service_role;
ALTER TABLE public.checkout_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_acceptances_read" ON public.checkout_acceptances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- checkout_events
CREATE TABLE IF NOT EXISTS public.checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checkout_events_session ON public.checkout_events(checkout_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_events_type ON public.checkout_events(event_type, created_at);

GRANT SELECT, INSERT ON public.checkout_events TO authenticated;
GRANT ALL ON public.checkout_events TO service_role;
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_admin_read" ON public.checkout_events
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_checkout_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_checkout_sessions_updated ON public.checkout_sessions;
CREATE TRIGGER trg_checkout_sessions_updated BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_checkout_updated_at();

-- ============================================================
-- RPC: checkout_start  (anonymous-safe via session_token)
-- ============================================================
CREATE OR REPLACE FUNCTION public.checkout_start(
  p_scholarship_id uuid,
  p_session_token text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_session public.checkout_sessions%ROWTYPE;
  v_fee numeric;
BEGIN
  -- Try to resume
  IF p_session_token IS NOT NULL THEN
    SELECT * INTO v_session FROM public.checkout_sessions
      WHERE session_token = p_session_token AND status = 'ACTIVE' AND expires_at > now()
      LIMIT 1;
    IF FOUND AND v_session.scholarship_id = p_scholarship_id THEN
      RETURN to_jsonb(v_session);
    END IF;
  END IF;

  -- Compute fee snapshot
  SELECT amount INTO v_fee FROM public.calculate_reservation_fee(p_scholarship_id);

  INSERT INTO public.checkout_sessions(user_id, scholarship_id, amount_charged)
  VALUES (auth.uid(), p_scholarship_id, COALESCE(v_fee, 59.90))
  RETURNING * INTO v_session;

  INSERT INTO public.checkout_events(checkout_session_id, event_type)
    VALUES (v_session.id, 'checkout_started');

  RETURN to_jsonb(v_session);
END $$;

GRANT EXECUTE ON FUNCTION public.checkout_start(uuid, text) TO anon, authenticated;

-- ============================================================
-- RPC: checkout_save_step
-- ============================================================
CREATE OR REPLACE FUNCTION public.checkout_save_step(
  p_session_token text,
  p_step public.checkout_step,
  p_personal jsonb DEFAULT NULL,
  p_address jsonb DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT NULL,
  p_installments smallint DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.checkout_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.checkout_sessions
    WHERE session_token = p_session_token AND status='ACTIVE' AND expires_at > now()
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão de checkout inválida ou expirada'; END IF;

  UPDATE public.checkout_sessions SET
    current_step = p_step,
    personal_data = COALESCE(p_personal, personal_data),
    address_data = COALESCE(p_address, address_data),
    payment_method = COALESCE(p_payment_method, payment_method),
    installments = COALESCE(p_installments, installments),
    user_id = COALESCE(user_id, auth.uid())
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  INSERT INTO public.checkout_events(checkout_session_id, event_type, metadata)
    VALUES (v_session.id, 'step_saved', jsonb_build_object('step', p_step));

  RETURN to_jsonb(v_session);
END $$;

GRANT EXECUTE ON FUNCTION public.checkout_save_step(text, public.checkout_step, jsonb, jsonb, public.payment_method, smallint) TO anon, authenticated;

-- ============================================================
-- RPC: checkout_check_existing_account
-- ============================================================
CREATE OR REPLACE FUNCTION public.checkout_check_existing_account(
  p_email text DEFAULT NULL,
  p_cpf text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_exists boolean := false;
BEGIN
  IF p_email IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE lower(email)=lower(p_email)) INTO v_exists;
    IF v_exists THEN RETURN jsonb_build_object('exists', true, 'method','email'); END IF;
  END IF;
  IF p_cpf IS NOT NULL AND length(regexp_replace(p_cpf,'\D','','g'))=11 THEN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE cpf = p_cpf) INTO v_exists;
    IF v_exists THEN RETURN jsonb_build_object('exists', true, 'method','cpf'); END IF;
  END IF;
  RETURN jsonb_build_object('exists', false);
END $$;

GRANT EXECUTE ON FUNCTION public.checkout_check_existing_account(text, text) TO anon, authenticated;

-- ============================================================
-- RPC: checkout_record_acceptances
-- ============================================================
CREATE OR REPLACE FUNCTION public.checkout_record_acceptances(
  p_session_token text,
  p_terms text[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.checkout_sessions%ROWTYPE; v_term text;
BEGIN
  SELECT * INTO v_session FROM public.checkout_sessions WHERE session_token=p_session_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  FOREACH v_term IN ARRAY p_terms LOOP
    INSERT INTO public.checkout_acceptances(
      checkout_session_id, user_id, lead_email, lead_name, lead_cpf, term_kind
    ) VALUES (
      v_session.id, v_session.user_id,
      v_session.personal_data->>'email',
      v_session.personal_data->>'name',
      v_session.personal_data->>'cpf',
      v_term
    );
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.checkout_record_acceptances(text, text[]) TO anon, authenticated;
