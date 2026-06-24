
-- Status de moderação
CREATE TYPE public.review_status AS ENUM ('PENDING','APPROVED','REJECTED');

-- Colunas agregadas em institutions
ALTER TABLE public.institutions
  ADD COLUMN rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN rating_count integer NOT NULL DEFAULT 0;

-- Tabela de reviews
CREATE TABLE public.institution_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  status public.review_status NOT NULL DEFAULT 'PENDING',
  moderation_notes text,
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id)
);

CREATE INDEX idx_reviews_institution_status ON public.institution_reviews (institution_id, status);
CREATE INDEX idx_reviews_user ON public.institution_reviews (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_reviews TO authenticated;
GRANT SELECT ON public.institution_reviews TO anon;
GRANT ALL ON public.institution_reviews TO service_role;

ALTER TABLE public.institution_reviews ENABLE ROW LEVEL SECURITY;

-- Público lê apenas APPROVED
CREATE POLICY "public read approved reviews"
  ON public.institution_reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'APPROVED');

-- Autor lê as próprias (qualquer status)
CREATE POLICY "owner reads own reviews"
  ON public.institution_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin plataforma lê todas
CREATE POLICY "admin reads all reviews"
  ON public.institution_reviews FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Autor insere desde que reserva esteja efetivada e seja sua
CREATE POLICY "owner inserts review for own approved enrollment"
  ON public.institution_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND r.user_id = auth.uid()
        AND r.institution_id = institution_reviews.institution_id
        AND r.status = 'ENROLLMENT_APPROVED'
    )
  );

-- Autor edita a própria (volta para PENDING via trigger)
CREATE POLICY "owner updates own review"
  ON public.institution_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Autor deleta a própria
CREATE POLICY "owner deletes own review"
  ON public.institution_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin modera (update status/notes)
CREATE POLICY "admin updates any review"
  ON public.institution_reviews FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "admin deletes any review"
  ON public.institution_reviews FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- updated_at
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.institution_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Quando o autor edita conteúdo, volta para PENDING (a menos que seja admin)
CREATE OR REPLACE FUNCTION public.reset_review_status_on_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    IF (NEW.rating IS DISTINCT FROM OLD.rating)
       OR (NEW.comment IS DISTINCT FROM OLD.comment) THEN
      NEW.status := 'PENDING';
      NEW.moderation_notes := NULL;
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_reviews_reset_on_edit
  BEFORE UPDATE ON public.institution_reviews
  FOR EACH ROW EXECUTE FUNCTION public.reset_review_status_on_edit();

-- Recalcula rating_avg e rating_count na instituição
CREATE OR REPLACE FUNCTION public.recalc_institution_rating(p_institution_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.institutions i
  SET rating_avg = COALESCE((
        SELECT round(avg(rating)::numeric, 2)
        FROM public.institution_reviews
        WHERE institution_id = p_institution_id AND status = 'APPROVED'
      ), 0),
      rating_count = COALESCE((
        SELECT count(*) FROM public.institution_reviews
        WHERE institution_id = p_institution_id AND status = 'APPROVED'
      ), 0)
  WHERE i.id = p_institution_id;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_institution_rating(OLD.institution_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_institution_rating(NEW.institution_id);
    IF TG_OP = 'UPDATE' AND OLD.institution_id <> NEW.institution_id THEN
      PERFORM public.recalc_institution_rating(OLD.institution_id);
    END IF;
    RETURN NEW;
  END IF;
END $$;

CREATE TRIGGER trg_reviews_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.institution_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_rating();

-- RPC de moderação (admin)
CREATE OR REPLACE FUNCTION public.moderate_review(
  p_review_id uuid,
  p_approve boolean,
  p_notes text DEFAULT NULL
) RETURNS public.institution_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.institution_reviews%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institution_reviews
     SET status = CASE WHEN p_approve THEN 'APPROVED'::review_status ELSE 'REJECTED'::review_status END,
         moderation_notes = NULLIF(p_notes,''),
         moderated_by = auth.uid(),
         moderated_at = now()
   WHERE id = p_review_id
  RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avaliação não encontrada'; END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_row.user_id, 'REVIEW_MODERATED',
    CASE WHEN p_approve THEN 'Sua avaliação foi publicada ⭐' ELSE 'Sua avaliação não foi aprovada' END,
    CASE WHEN p_approve
      THEN 'Obrigado! Sua avaliação já está visível na página da instituição.'
      ELSE 'Sua avaliação não atendeu às nossas diretrizes. ' || COALESCE(p_notes,'')
    END,
    '/instituicoes');
  RETURN v_row;
END $$;

REVOKE EXECUTE ON FUNCTION public.moderate_review(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recalc_institution_rating(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_review_status_on_edit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_recalc_rating() FROM anon, authenticated, public;
