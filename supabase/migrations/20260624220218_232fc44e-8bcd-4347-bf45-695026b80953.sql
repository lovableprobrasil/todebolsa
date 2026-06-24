
-- Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Code generator
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END $$;

UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.set_referral_code_default() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN NEW.referral_code := public.generate_referral_code(); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_profile_referral_code ON public.profiles;
CREATE TRIGGER set_profile_referral_code BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code_default();

-- Credits
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  source TEXT NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_credits TO authenticated;
GRANT ALL ON public.referral_credits TO service_role;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own credits" ON public.referral_credits FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON public.referral_credits(user_id);

-- Payouts (PIX)
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT ON public.referral_payouts TO authenticated;
GRANT ALL ON public.referral_payouts TO service_role;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own payouts" ON public.referral_payouts FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Users create own payouts" ON public.referral_payouts FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage payouts" ON public.referral_payouts FOR UPDATE
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_code)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are public" ON public.user_badges FOR SELECT USING (true);

-- Set referrer (one-time)
CREATE OR REPLACE FUNCTION public.set_referrer(p_code TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_ref UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_uid AND referred_by_user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Indicação já registrada.';
  END IF;
  SELECT user_id INTO v_ref FROM public.profiles WHERE upper(referral_code) = upper(p_code);
  IF v_ref IS NULL THEN RAISE EXCEPTION 'Código inválido.'; END IF;
  IF v_ref = v_uid THEN RAISE EXCEPTION 'Você não pode indicar a si mesmo.'; END IF;
  UPDATE public.profiles SET referred_by_user_id = v_ref WHERE user_id = v_uid;
END $$;

-- Award credit on payment + badges
CREATE OR REPLACE FUNCTION public.award_referral_on_payment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref UUID; v_count INT; v_credit NUMERIC := 25.00;
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    SELECT referred_by_user_id INTO v_ref FROM public.profiles WHERE user_id = NEW.user_id;
    IF v_ref IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.referral_credits WHERE reservation_id = NEW.id
    ) THEN
      INSERT INTO public.referral_credits (user_id, amount, source, reservation_id, referred_user_id)
      VALUES (v_ref, v_credit, 'REFERRED_PAYMENT', NEW.id, NEW.user_id);

      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (v_ref, 'REFERRAL_CREDIT',
        'Você ganhou R$ ' || v_credit || ' em créditos! 🎉',
        'Um amigo indicado por você confirmou uma reserva.', '/perfil/indicacoes');

      -- Badge thresholds
      SELECT COUNT(*) INTO v_count FROM public.referral_credits WHERE user_id = v_ref AND source = 'REFERRED_PAYMENT';
      IF v_count = 1 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'first_referral') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 5 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'five_referrals') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 10 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'ten_referrals') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 25 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'top_promoter') ON CONFLICT DO NOTHING; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_award_referral ON public.reservations;
CREATE TRIGGER trg_award_referral AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.award_referral_on_payment();

-- Request PIX payout
CREATE OR REPLACE FUNCTION public.request_referral_payout(p_amount NUMERIC, p_pix_key TEXT, p_pix_type TEXT)
RETURNS public.referral_payouts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_balance NUMERIC;
  v_payout public.referral_payouts%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_amount < 25 THEN RAISE EXCEPTION 'Saque mínimo de R$ 25,00.'; END IF;
  IF p_pix_key IS NULL OR length(trim(p_pix_key)) < 3 THEN RAISE EXCEPTION 'Chave PIX obrigatória.'; END IF;
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.referral_credits WHERE user_id = v_uid), 0)
    - COALESCE((SELECT SUM(amount) FROM public.referral_payouts WHERE user_id = v_uid AND status IN ('REQUESTED','PAID')), 0)
  INTO v_balance;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Saldo insuficiente (disponível: R$ %).', v_balance; END IF;
  INSERT INTO public.referral_payouts (user_id, amount, pix_key, pix_key_type)
  VALUES (v_uid, p_amount, p_pix_key, p_pix_type) RETURNING * INTO v_payout;
  RETURN v_payout;
END $$;

-- Summary
CREATE OR REPLACE FUNCTION public.referral_summary() RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT jsonb_build_object(
    'code', (SELECT referral_code FROM public.profiles WHERE user_id = v_uid),
    'referred_count', (SELECT COUNT(*) FROM public.profiles WHERE referred_by_user_id = v_uid),
    'paid_count', (SELECT COUNT(*) FROM public.referral_credits WHERE user_id = v_uid AND source='REFERRED_PAYMENT'),
    'total_earned', COALESCE((SELECT SUM(amount) FROM public.referral_credits WHERE user_id = v_uid), 0),
    'total_paid_out', COALESCE((SELECT SUM(amount) FROM public.referral_payouts WHERE user_id = v_uid AND status='PAID'), 0),
    'pending_payout', COALESCE((SELECT SUM(amount) FROM public.referral_payouts WHERE user_id = v_uid AND status='REQUESTED'), 0),
    'balance', (
      COALESCE((SELECT SUM(amount) FROM public.referral_credits WHERE user_id = v_uid), 0)
      - COALESCE((SELECT SUM(amount) FROM public.referral_payouts WHERE user_id = v_uid AND status IN ('REQUESTED','PAID')), 0)
    ),
    'badges', COALESCE((SELECT jsonb_agg(badge_code ORDER BY earned_at) FROM public.user_badges WHERE user_id = v_uid), '[]'::jsonb)
  ) INTO v;
  RETURN v::json;
END $$;

-- Public leaderboard
CREATE OR REPLACE FUNCTION public.referral_leaderboard(p_limit INT DEFAULT 10) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO v FROM (
    SELECT
      coalesce(split_part(p.name, ' ', 1), 'Estudante') || ' ' || left(coalesce(split_part(p.name, ' ', 2), ''), 1) || '.' AS short_name,
      COUNT(c.id) AS referrals,
      COALESCE(SUM(c.amount), 0) AS earned
    FROM public.profiles p
    JOIN public.referral_credits c ON c.user_id = p.user_id AND c.source = 'REFERRED_PAYMENT'
    GROUP BY p.user_id, p.name
    ORDER BY referrals DESC, earned DESC
    LIMIT p_limit
  ) t;
  RETURN COALESCE(v, '[]'::json);
END $$;
