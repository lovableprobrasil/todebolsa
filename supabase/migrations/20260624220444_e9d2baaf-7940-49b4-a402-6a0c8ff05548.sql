
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
        'Um amigo indicado por você confirmou uma reserva.', '/indicacoes');
      SELECT COUNT(*) INTO v_count FROM public.referral_credits WHERE user_id = v_ref AND source = 'REFERRED_PAYMENT';
      IF v_count = 1 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'first_referral') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 5 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'five_referrals') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 10 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'ten_referrals') ON CONFLICT DO NOTHING; END IF;
      IF v_count = 25 THEN INSERT INTO public.user_badges (user_id, badge_code) VALUES (v_ref, 'top_promoter') ON CONFLICT DO NOTHING; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
