
-- 1) Enums
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'INSTITUTION_APPLICANT';

DO $$ BEGIN
  CREATE TYPE public.institution_application_status AS ENUM
    ('DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_INFO','APPROVED','REJECTED','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.institution_service_mode AS ENUM ('PRESENCIAL','EAD','HIBRIDO','POLOS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Applications table
CREATE TABLE IF NOT EXISTS public.institution_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.institution_application_status NOT NULL DEFAULT 'DRAFT',

  -- Identificação
  trade_name TEXT,
  legal_name TEXT,
  cnpj TEXT,
  institution_type TEXT,
  website TEXT,
  instagram TEXT,
  phone TEXT,
  email TEXT,

  -- Responsável
  responsible_name TEXT,
  responsible_role TEXT,
  responsible_cpf TEXT,
  responsible_email TEXT,
  responsible_whatsapp TEXT,
  authorization_declared BOOLEAN NOT NULL DEFAULT false,

  -- Endereço
  zip TEXT,
  address TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  service_mode public.institution_service_mode,

  -- Oferta
  courses_offered TEXT[] NOT NULL DEFAULT '{}',
  levels TEXT[] NOT NULL DEFAULT '{}',
  modalities TEXT[] NOT NULL DEFAULT '{}',
  has_idle_vacancies BOOLEAN,
  avg_discount_pct INTEGER,
  monthly_vacancies INTEGER,

  -- Aceites
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  accepted_privacy BOOLEAN NOT NULL DEFAULT false,
  accepted_truthfulness BOOLEAN NOT NULL DEFAULT false,
  accepted_representation BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,

  -- Comercial
  high_potential BOOLEAN NOT NULL DEFAULT false,
  assigned_sales_id UUID,
  internal_notes TEXT,

  -- Vínculo / análise
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inst_app_user ON public.institution_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_inst_app_status ON public.institution_applications(status);
CREATE INDEX IF NOT EXISTS idx_inst_app_cnpj ON public.institution_applications(cnpj);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_applications TO authenticated;
GRANT ALL ON public.institution_applications TO service_role;

ALTER TABLE public.institution_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant manages own application"
  ON public.institution_applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Platform admin views all applications"
  ON public.institution_applications FOR SELECT
  USING (public.is_platform_admin() OR public.has_role(auth.uid(), 'PLATFORM_SALES'));

CREATE POLICY "Platform admin updates applications"
  ON public.institution_applications FOR UPDATE
  USING (public.is_platform_admin() OR public.has_role(auth.uid(), 'PLATFORM_SALES'));

CREATE TRIGGER trg_inst_app_updated_at
  BEFORE UPDATE ON public.institution_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Documents table
CREATE TABLE IF NOT EXISTS public.institution_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.institution_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_application_documents TO authenticated;
GRANT ALL ON public.institution_application_documents TO service_role;

ALTER TABLE public.institution_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own app docs"
  ON public.institution_application_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin views app docs"
  ON public.institution_application_documents FOR SELECT
  USING (public.is_platform_admin() OR public.has_role(auth.uid(),'PLATFORM_SALES'));

-- 4) Messages thread
CREATE TABLE IF NOT EXISTS public.institution_application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.institution_applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_role TEXT NOT NULL, -- 'APPLICANT' | 'ADMIN'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.institution_application_messages TO authenticated;
GRANT ALL ON public.institution_application_messages TO service_role;

ALTER TABLE public.institution_application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant reads own thread"
  ON public.institution_application_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.institution_applications a
            WHERE a.id = application_id AND a.user_id = auth.uid())
    OR public.is_platform_admin()
    OR public.has_role(auth.uid(),'PLATFORM_SALES')
  );

CREATE POLICY "Participants post in thread"
  ON public.institution_application_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (SELECT 1 FROM public.institution_applications a
              WHERE a.id = application_id AND a.user_id = auth.uid())
      OR public.is_platform_admin()
      OR public.has_role(auth.uid(),'PLATFORM_SALES')
    )
  );

-- 5) Onboarding checklist (post-approval)
CREATE TABLE IF NOT EXISTS public.institution_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  step_code TEXT NOT NULL,
  step_title TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, step_code)
);

GRANT SELECT, INSERT, UPDATE ON public.institution_onboarding_checklist TO authenticated;
GRANT ALL ON public.institution_onboarding_checklist TO service_role;

ALTER TABLE public.institution_onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admin manages checklist"
  ON public.institution_onboarding_checklist FOR ALL
  USING (public.is_institution_admin(auth.uid(), institution_id) OR public.is_platform_admin())
  WITH CHECK (public.is_institution_admin(auth.uid(), institution_id) OR public.is_platform_admin());

-- 6) RPC: start or get current draft application
CREATE OR REPLACE FUNCTION public.start_institution_application()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO v_id FROM public.institution_applications
   WHERE user_id = v_uid AND status IN ('DRAFT','NEEDS_INFO')
   ORDER BY created_at DESC LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.institution_applications (user_id, status)
    VALUES (v_uid, 'DRAFT') RETURNING id INTO v_id;
  END IF;

  -- promote to APPLICANT (additive; keep STUDENT)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'INSTITUTION_APPLICANT')
  ON CONFLICT DO NOTHING;

  RETURN v_id;
END $$;

-- 7) RPC: save draft (partial upsert)
CREATE OR REPLACE FUNCTION public.save_institution_application(p_id uuid, p_payload jsonb)
RETURNS public.institution_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.institution_applications;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.institution_applications WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_row.user_id <> v_uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF v_row.status NOT IN ('DRAFT','NEEDS_INFO') THEN
    RAISE EXCEPTION 'Aplicação não pode ser editada (status %)', v_row.status;
  END IF;

  UPDATE public.institution_applications SET
    trade_name = COALESCE(p_payload->>'trade_name', trade_name),
    legal_name = COALESCE(p_payload->>'legal_name', legal_name),
    cnpj = COALESCE(p_payload->>'cnpj', cnpj),
    institution_type = COALESCE(p_payload->>'institution_type', institution_type),
    website = COALESCE(p_payload->>'website', website),
    instagram = COALESCE(p_payload->>'instagram', instagram),
    phone = COALESCE(p_payload->>'phone', phone),
    email = COALESCE(p_payload->>'email', email),
    responsible_name = COALESCE(p_payload->>'responsible_name', responsible_name),
    responsible_role = COALESCE(p_payload->>'responsible_role', responsible_role),
    responsible_cpf = COALESCE(p_payload->>'responsible_cpf', responsible_cpf),
    responsible_email = COALESCE(p_payload->>'responsible_email', responsible_email),
    responsible_whatsapp = COALESCE(p_payload->>'responsible_whatsapp', responsible_whatsapp),
    authorization_declared = COALESCE((p_payload->>'authorization_declared')::boolean, authorization_declared),
    zip = COALESCE(p_payload->>'zip', zip),
    address = COALESCE(p_payload->>'address', address),
    number = COALESCE(p_payload->>'number', number),
    complement = COALESCE(p_payload->>'complement', complement),
    neighborhood = COALESCE(p_payload->>'neighborhood', neighborhood),
    city = COALESCE(p_payload->>'city', city),
    state = COALESCE(p_payload->>'state', state),
    service_mode = COALESCE((p_payload->>'service_mode')::institution_service_mode, service_mode),
    courses_offered = COALESCE(
      CASE WHEN p_payload ? 'courses_offered'
           THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'courses_offered')) END,
      courses_offered),
    levels = COALESCE(
      CASE WHEN p_payload ? 'levels'
           THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'levels')) END,
      levels),
    modalities = COALESCE(
      CASE WHEN p_payload ? 'modalities'
           THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'modalities')) END,
      modalities),
    has_idle_vacancies = COALESCE((p_payload->>'has_idle_vacancies')::boolean, has_idle_vacancies),
    avg_discount_pct = COALESCE((p_payload->>'avg_discount_pct')::int, avg_discount_pct),
    monthly_vacancies = COALESCE((p_payload->>'monthly_vacancies')::int, monthly_vacancies),
    accepted_terms = COALESCE((p_payload->>'accepted_terms')::boolean, accepted_terms),
    accepted_privacy = COALESCE((p_payload->>'accepted_privacy')::boolean, accepted_privacy),
    accepted_truthfulness = COALESCE((p_payload->>'accepted_truthfulness')::boolean, accepted_truthfulness),
    accepted_representation = COALESCE((p_payload->>'accepted_representation')::boolean, accepted_representation)
  WHERE id = p_id RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- 8) RPC: submit application
CREATE OR REPLACE FUNCTION public.submit_institution_application(p_id uuid)
RETURNS public.institution_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.institution_applications; v_admin uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.institution_applications WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_row.user_id <> v_uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF v_row.status NOT IN ('DRAFT','NEEDS_INFO') THEN
    RAISE EXCEPTION 'Aplicação já enviada (status %)', v_row.status;
  END IF;
  IF COALESCE(v_row.trade_name,'') = '' OR COALESCE(v_row.cnpj,'') = ''
     OR COALESCE(v_row.responsible_name,'') = '' OR COALESCE(v_row.responsible_email,'') = ''
     OR COALESCE(v_row.city,'') = '' OR COALESCE(v_row.state,'') = '' THEN
    RAISE EXCEPTION 'Preencha todos os campos obrigatórios antes de enviar.';
  END IF;
  IF NOT (v_row.accepted_terms AND v_row.accepted_privacy
          AND v_row.accepted_truthfulness AND v_row.accepted_representation
          AND v_row.authorization_declared) THEN
    RAISE EXCEPTION 'É necessário aceitar todos os termos.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.institutions WHERE cnpj = v_row.cnpj AND status='APPROVED') THEN
    RAISE EXCEPTION 'Já existe uma instituição aprovada com este CNPJ.';
  END IF;

  UPDATE public.institution_applications
    SET status='SUBMITTED', submitted_at = now(), accepted_at = now()
   WHERE id = p_id RETURNING * INTO v_row;

  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role='PLATFORM_ADMIN' LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (v_admin, 'INSTITUTION_APPLICATION',
      'Novo credenciamento de instituição',
      v_row.trade_name || ' enviou um cadastro para análise.',
      '/admin/credenciamento-instituicoes/' || v_row.id::text);
  END LOOP;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_uid, 'INSTITUTION_APPLICATION',
    'Cadastro enviado para análise ⏳',
    'Recebemos seus dados. Você será notificado quando a análise for concluída.',
    '/instituicao/credenciamento');

  RETURN v_row;
END $$;

-- 9) Admin actions
CREATE OR REPLACE FUNCTION public.set_application_status(
  p_id uuid, p_status institution_application_status, p_message text DEFAULT NULL
) RETURNS public.institution_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.institution_applications;
BEGIN
  IF NOT (public.is_platform_admin() OR public.has_role(auth.uid(),'PLATFORM_SALES')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.institution_applications
    SET status = p_status,
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        rejection_reason = CASE WHEN p_status='REJECTED' THEN NULLIF(p_message,'') ELSE rejection_reason END
  WHERE id = p_id RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;

  IF p_message IS NOT NULL AND length(p_message) > 0 THEN
    INSERT INTO public.institution_application_messages (application_id, author_id, author_role, message)
    VALUES (p_id, auth.uid(), 'ADMIN', p_message);
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_row.user_id, 'INSTITUTION_APPLICATION',
    CASE p_status
      WHEN 'UNDER_REVIEW' THEN 'Seu cadastro está em análise 🔍'
      WHEN 'NEEDS_INFO' THEN 'Precisamos de mais informações'
      WHEN 'REJECTED' THEN 'Cadastro recusado'
      WHEN 'SUSPENDED' THEN 'Cadastro suspenso'
      ELSE 'Atualização do credenciamento'
    END,
    COALESCE(NULLIF(p_message,''), 'Status atualizado para ' || p_status::text),
    '/instituicao/credenciamento');

  RETURN v_row;
END $$;

-- 10) Approve application: creates institution, unit, role swap, checklist
CREATE OR REPLACE FUNCTION public.approve_institution_application(p_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app public.institution_applications;
  v_inst_id uuid;
  v_slug text;
  v_base text;
  v_n int := 0;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_app FROM public.institution_applications WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;

  -- find or create institution
  v_inst_id := v_app.institution_id;
  IF v_inst_id IS NULL THEN
    v_base := regexp_replace(lower(public.unaccent_safe(v_app.trade_name)), '[^a-z0-9]+', '-', 'g');
    v_base := trim(both '-' from v_base);
    IF v_base = '' THEN v_base := 'instituicao'; END IF;
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM public.institutions WHERE slug = v_slug) LOOP
      v_n := v_n + 1; v_slug := v_base || '-' || v_n::text;
    END LOOP;

    INSERT INTO public.institutions
      (slug, trade_name, legal_name, cnpj, email, phone, website, status, is_featured)
    VALUES
      (v_slug, v_app.trade_name, v_app.legal_name, v_app.cnpj, v_app.email,
       v_app.phone, v_app.website, 'APPROVED', false)
    RETURNING id INTO v_inst_id;

    INSERT INTO public.institution_units (institution_id, name, city, state, is_main)
    VALUES (v_inst_id, 'Unidade matriz', COALESCE(v_app.city,'—'), COALESCE(v_app.state,'SP'), true);
  ELSE
    UPDATE public.institutions SET status='APPROVED' WHERE id = v_inst_id;
  END IF;

  -- swap role: remove APPLICANT, add INSTITUTION_ADMIN
  DELETE FROM public.user_roles
    WHERE user_id = v_app.user_id AND role = 'INSTITUTION_APPLICANT';
  INSERT INTO public.user_roles (user_id, role, institution_id)
    VALUES (v_app.user_id, 'INSTITUTION_ADMIN', v_inst_id)
    ON CONFLICT DO NOTHING;

  -- application status
  UPDATE public.institution_applications
    SET status='APPROVED', institution_id = v_inst_id,
        reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_id;

  -- onboarding checklist
  INSERT INTO public.institution_onboarding_checklist (institution_id, step_code, step_title, step_order)
  VALUES
    (v_inst_id, 'complete_profile','Completar perfil da instituição',1),
    (v_inst_id, 'upload_logo','Enviar logo',2),
    (v_inst_id, 'create_unit','Cadastrar primeira unidade',3),
    (v_inst_id, 'create_course','Cadastrar primeiro curso',4),
    (v_inst_id, 'create_scholarship','Criar primeira bolsa',5),
    (v_inst_id, 'await_validation','Aguardar validação/publicação',6)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_app.user_id, 'INSTITUTION_APPROVED',
    'Instituição aprovada 🎉',
    'Parabéns! Seu acesso ao painel da instituição foi liberado.',
    '/instituicao/' || v_inst_id::text);

  RETURN v_inst_id;
END $$;

-- 11) Mark high potential / assign sales
CREATE OR REPLACE FUNCTION public.toggle_application_high_potential(p_id uuid, p_flag boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.has_role(auth.uid(),'PLATFORM_SALES')) THEN
    RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institution_applications SET high_potential = p_flag WHERE id = p_id;
END $$;

CREATE OR REPLACE FUNCTION public.assign_application_sales(p_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institution_applications SET assigned_sales_id = p_user_id WHERE id = p_id;
END $$;

CREATE OR REPLACE FUNCTION public.set_application_internal_notes(p_id uuid, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.has_role(auth.uid(),'PLATFORM_SALES')) THEN
    RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institution_applications SET internal_notes = p_notes WHERE id = p_id;
END $$;

-- 12) Post message in thread
CREATE OR REPLACE FUNCTION public.post_application_message(p_id uuid, p_message text)
RETURNS public.institution_application_messages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_app public.institution_applications; v_role text; v_row public.institution_application_messages;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_app FROM public.institution_applications WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF v_app.user_id = v_uid THEN v_role := 'APPLICANT';
  ELSIF public.is_platform_admin() OR public.has_role(v_uid,'PLATFORM_SALES') THEN v_role := 'ADMIN';
  ELSE RAISE EXCEPTION 'Forbidden'; END IF;

  INSERT INTO public.institution_application_messages (application_id, author_id, author_role, message)
  VALUES (p_id, v_uid, v_role, p_message) RETURNING * INTO v_row;

  -- notify the other side
  IF v_role = 'APPLICANT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT ur.user_id, 'INSTITUTION_APPLICATION', 'Nova mensagem do candidato',
           left(p_message, 140), '/admin/credenciamento-instituicoes/' || p_id::text
      FROM public.user_roles ur WHERE ur.role = 'PLATFORM_ADMIN';
  ELSE
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (v_app.user_id, 'INSTITUTION_APPLICATION', 'Nova mensagem da equipe Tô de Bolsa',
            left(p_message, 140), '/instituicao/credenciamento');
  END IF;

  RETURN v_row;
END $$;

-- 13) Checklist toggle
CREATE OR REPLACE FUNCTION public.toggle_onboarding_step(p_id uuid, p_done boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inst uuid;
BEGIN
  SELECT institution_id INTO v_inst FROM public.institution_onboarding_checklist WHERE id = p_id;
  IF v_inst IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  IF NOT (public.is_institution_admin(auth.uid(), v_inst) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.institution_onboarding_checklist
    SET completed_at = CASE WHEN p_done THEN now() ELSE NULL END
  WHERE id = p_id;
END $$;
