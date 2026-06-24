
-- =====================================================================
-- FASE 6 — CRM, Leads e Ferramentas Comerciais (Admin Tô de Bolsa)
--          + Fila "matrículas pagas → efetivar" para instituições
-- =====================================================================

-- ---------- 1. Atividades de leads (CRM) -----------------------------
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('CALL','EMAIL','WHATSAPP','MEETING','NOTE','TASK')),
  title text NOT NULL,
  description text,
  due_at timestamptz,
  done_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales and admin see lead activities" ON public.lead_activities
  FOR SELECT USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE POLICY "sales and admin manage lead activities" ON public.lead_activities
  FOR ALL USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'))
  WITH CHECK (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_lead_activities_updated BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX idx_lead_activities_due ON public.lead_activities(due_at) WHERE done_at IS NULL;

-- ---------- 2. Pipeline de instituições prospectadas -----------------
CREATE TYPE public.prospect_status AS ENUM (
  'NEW','CONTACTED','MEETING_SCHEDULED','PROPOSAL_SENT','NEGOTIATION','WON','LOST'
);

CREATE TABLE public.institution_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name text NOT NULL,
  legal_name text,
  cnpj text,
  city text,
  state text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  estimated_courses int,
  estimated_students int,
  status public.prospect_status NOT NULL DEFAULT 'NEW',
  next_action_at timestamptz,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_prospects TO authenticated;
GRANT ALL ON public.institution_prospects TO service_role;
ALTER TABLE public.institution_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales and admin see prospects" ON public.institution_prospects
  FOR SELECT USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE POLICY "sales and admin manage prospects" ON public.institution_prospects
  FOR ALL USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'))
  WITH CHECK (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_prospects_updated BEFORE UPDATE ON public.institution_prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_prospects_status ON public.institution_prospects(status);
CREATE INDEX idx_prospects_owner ON public.institution_prospects(owner_id);

CREATE TABLE public.prospect_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.institution_prospects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('CALL','EMAIL','WHATSAPP','MEETING','NOTE','TASK')),
  title text NOT NULL,
  description text,
  due_at timestamptz,
  done_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_activities TO authenticated;
GRANT ALL ON public.prospect_activities TO service_role;
ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales and admin see prospect activities" ON public.prospect_activities
  FOR SELECT USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE POLICY "sales and admin manage prospect activities" ON public.prospect_activities
  FOR ALL USING (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'))
  WITH CHECK (has_role(auth.uid(),'PLATFORM_SALES') OR has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_prospect_activities_updated BEFORE UPDATE ON public.prospect_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_prospect_activities_prospect ON public.prospect_activities(prospect_id, created_at DESC);

-- ---------- 3. Captura pública de leads ------------------------------
-- Permite que o site público crie leads (formulário "quero saber mais")
-- sem necessidade de login. Apenas INSERT, nunca SELECT.
DROP POLICY IF EXISTS "anon can create leads" ON public.leads;
CREATE POLICY "anon can create leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'NEW' AND owner_id IS NULL);
GRANT INSERT ON public.leads TO anon;

-- ---------- 4. Instituições veem suas reservas (fila a efetivar) -----
CREATE POLICY "institution admins see their reservations" ON public.reservations
  FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));

-- ---------- 5. RPC: instituição efetiva matrícula --------------------
CREATE OR REPLACE FUNCTION public.confirm_enrollment(
  p_reservation_id uuid,
  p_approve boolean,
  p_notes text DEFAULT NULL
) RETURNS public.reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_res public.reservations%ROWTYPE; v_new_status reservation_status;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF NOT public.is_institution_admin(auth.uid(), v_res.institution_id)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF v_res.payment_status <> 'PAID' THEN
    RAISE EXCEPTION 'Matrícula ainda não foi paga ao Tô de Bolsa.';
  END IF;
  IF v_res.status NOT IN ('CONFIRMED','AWAITING_ENROLLMENT','UNDER_REVIEW') THEN
    RAISE EXCEPTION 'Reserva não está apta para efetivação (status %)', v_res.status;
  END IF;

  v_new_status := CASE WHEN p_approve THEN 'ENROLLMENT_APPROVED'::reservation_status
                       ELSE 'ENROLLMENT_REJECTED'::reservation_status END;

  UPDATE public.reservations SET status = v_new_status WHERE id = p_reservation_id
  RETURNING * INTO v_res;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_res.user_id, 'ENROLLMENT_UPDATE',
    CASE WHEN p_approve THEN 'Matrícula efetivada na instituição 🎓' ELSE 'Matrícula não efetivada' END,
    CASE WHEN p_approve
      THEN 'Sua matrícula ' || v_res.reservation_code || ' foi efetivada pela instituição.'
      ELSE 'A instituição não pôde efetivar sua matrícula ' || v_res.reservation_code || '. ' || COALESCE(p_notes,'')
    END,
    '/reservas/' || v_res.id::text);

  RETURN v_res;
END $$;

-- ---------- 6. RPC: CRM helpers (admin/sales) ------------------------
CREATE OR REPLACE FUNCTION public.assign_lead(p_lead_id uuid, p_owner_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'PLATFORM_SALES') OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.leads SET owner_id = p_owner_id WHERE id = p_lead_id;
END $$;

CREATE OR REPLACE FUNCTION public.update_lead_status(p_lead_id uuid, p_status lead_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'PLATFORM_SALES') OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.leads SET status = p_status WHERE id = p_lead_id;
END $$;

CREATE OR REPLACE FUNCTION public.crm_overview()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (has_role(auth.uid(),'PLATFORM_SALES') OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT jsonb_build_object(
    'leads_total',(SELECT count(*) FROM public.leads),
    'leads_new',(SELECT count(*) FROM public.leads WHERE status='NEW'),
    'leads_contacted',(SELECT count(*) FROM public.leads WHERE status='CONTACTED'),
    'leads_interested',(SELECT count(*) FROM public.leads WHERE status='INTERESTED'),
    'leads_won',(SELECT count(*) FROM public.leads WHERE status IN ('RESERVATION_DONE','ENROLLMENT_DONE')),
    'leads_lost',(SELECT count(*) FROM public.leads WHERE status='LOST'),
    'leads_7d',(SELECT count(*) FROM public.leads WHERE created_at > now() - interval '7 days'),
    'prospects_total',(SELECT count(*) FROM public.institution_prospects),
    'prospects_won',(SELECT count(*) FROM public.institution_prospects WHERE status='WON'),
    'prospects_active',(SELECT count(*) FROM public.institution_prospects WHERE status NOT IN ('WON','LOST')),
    'tasks_open',(SELECT count(*) FROM public.lead_activities WHERE done_at IS NULL AND due_at IS NOT NULL)
      + (SELECT count(*) FROM public.prospect_activities WHERE done_at IS NULL AND due_at IS NOT NULL),
    'tasks_overdue',(SELECT count(*) FROM public.lead_activities WHERE done_at IS NULL AND due_at < now())
      + (SELECT count(*) FROM public.prospect_activities WHERE done_at IS NULL AND due_at < now())
  ) INTO v;
  RETURN v::json;
END $$;
