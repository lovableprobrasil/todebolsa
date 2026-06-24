
DO $$ BEGIN
  CREATE TYPE public.enrollment_doc_type AS ENUM (
    'RG', 'CPF', 'PROOF_OF_ADDRESS', 'INCOME_PROOF', 'PREVIOUS_DIPLOMA',
    'ENROLLMENT_DECLARATION', 'PHOTO', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_doc_status AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.enrollment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.enrollment_doc_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status public.enrollment_doc_status NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollment_documents TO authenticated;
GRANT ALL ON public.enrollment_documents TO service_role;

ALTER TABLE public.enrollment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documents" ON public.enrollment_documents FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Users insert own documents" ON public.enrollment_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own pending documents" ON public.enrollment_documents FOR DELETE
  USING (user_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "Admins manage documents" ON public.enrollment_documents FOR ALL
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TRIGGER set_enrollment_documents_updated_at
  BEFORE UPDATE ON public.enrollment_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_enroll_docs_reservation ON public.enrollment_documents(reservation_id);
CREATE INDEX IF NOT EXISTS idx_enroll_docs_user ON public.enrollment_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_docs_status ON public.enrollment_documents(status);

-- Storage policies
CREATE POLICY "enroll_docs_user_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'enrollment-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_platform_admin()));
CREATE POLICY "enroll_docs_user_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'enrollment-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "enroll_docs_user_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'enrollment-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_platform_admin()));

-- Student submits document
CREATE OR REPLACE FUNCTION public.submit_enrollment_document(
  p_reservation_id UUID,
  p_doc_type public.enrollment_doc_type,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT
) RETURNS public.enrollment_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_enroll public.enrollments%ROWTYPE;
  v_doc public.enrollment_documents%ROWTYPE;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF v_res.user_id <> auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_res.payment_status <> 'PAID' THEN
    RAISE EXCEPTION 'Pague a taxa de adesão antes de enviar documentos.';
  END IF;

  SELECT * INTO v_enroll FROM public.enrollments WHERE reservation_id = p_reservation_id;
  IF NOT FOUND THEN
    INSERT INTO public.enrollments (reservation_id, user_id, institution_id, status)
    VALUES (p_reservation_id, v_res.user_id, v_res.institution_id, 'DOCUMENTS_PENDING')
    RETURNING * INTO v_enroll;
  END IF;

  INSERT INTO public.enrollment_documents
    (reservation_id, enrollment_id, user_id, doc_type, file_path, file_name, file_size, mime_type, status)
  VALUES
    (p_reservation_id, v_enroll.id, auth.uid(), p_doc_type, p_file_path, p_file_name, p_file_size, p_mime_type, 'PENDING')
  RETURNING * INTO v_doc;

  UPDATE public.reservations SET status = 'UNDER_REVIEW'
    WHERE id = p_reservation_id AND status IN ('CONFIRMED','AWAITING_ENROLLMENT');
  UPDATE public.enrollments SET status = 'UNDER_REVIEW'
    WHERE id = v_enroll.id AND status = 'DOCUMENTS_PENDING';

  RETURN v_doc;
END $$;

CREATE OR REPLACE FUNCTION public.review_enrollment_document(
  p_document_id UUID, p_approved BOOLEAN, p_reason TEXT
) RETURNS public.enrollment_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doc public.enrollment_documents%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.enrollment_documents
    SET status = CASE WHEN p_approved THEN 'APPROVED'::public.enrollment_doc_status ELSE 'REJECTED'::public.enrollment_doc_status END,
        rejection_reason = CASE WHEN p_approved THEN NULL ELSE NULLIF(p_reason,'') END,
        reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_document_id RETURNING * INTO v_doc;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado'; END IF;
  IF NOT p_approved THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (v_doc.user_id, 'DOCUMENT_REJECTED', 'Documento recusado',
      'Reenvie seu ' || v_doc.doc_type::text || '. Motivo: ' || COALESCE(p_reason,'verificar requisitos'),
      '/reservas/' || v_doc.reservation_id::text);
  END IF;
  RETURN v_doc;
END $$;

CREATE OR REPLACE FUNCTION public.finalize_enrollment(
  p_reservation_id UUID, p_approved BOOLEAN, p_notes TEXT
) RETURNS public.enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_enroll public.enrollments%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  SELECT * INTO v_enroll FROM public.enrollments WHERE reservation_id = p_reservation_id;
  IF NOT FOUND THEN
    INSERT INTO public.enrollments (reservation_id, user_id, institution_id, status, notes)
    VALUES (p_reservation_id, v_res.user_id, v_res.institution_id,
      CASE WHEN p_approved THEN 'APPROVED'::public.enrollment_status ELSE 'REJECTED'::public.enrollment_status END,
      NULLIF(p_notes,''))
    RETURNING * INTO v_enroll;
  ELSE
    UPDATE public.enrollments
      SET status = CASE WHEN p_approved THEN 'APPROVED'::public.enrollment_status ELSE 'REJECTED'::public.enrollment_status END,
          notes = COALESCE(NULLIF(p_notes,''), notes)
    WHERE id = v_enroll.id RETURNING * INTO v_enroll;
  END IF;
  UPDATE public.reservations
    SET status = CASE WHEN p_approved THEN 'ENROLLMENT_APPROVED'::public.reservation_status ELSE 'ENROLLMENT_REJECTED'::public.reservation_status END
  WHERE id = p_reservation_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_res.user_id,
    CASE WHEN p_approved THEN 'ENROLLMENT_APPROVED' ELSE 'ENROLLMENT_REJECTED' END,
    CASE WHEN p_approved THEN 'Matrícula aprovada 🎓' ELSE 'Matrícula recusada' END,
    CASE WHEN p_approved THEN 'Parabéns! Sua matrícula foi confirmada pela instituição.'
         ELSE COALESCE(NULLIF(p_notes,''),'Sua matrícula não pôde ser aprovada. Entre em contato com a instituição.') END,
    '/reservas/' || p_reservation_id::text);
  RETURN v_enroll;
END $$;
