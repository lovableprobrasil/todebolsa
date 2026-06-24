
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

  v_inst_id := v_app.institution_id;
  IF v_inst_id IS NULL THEN
    v_base := regexp_replace(lower(coalesce(v_app.trade_name,'instituicao')), '[^a-z0-9]+', '-', 'g');
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

  DELETE FROM public.user_roles
    WHERE user_id = v_app.user_id AND role = 'INSTITUTION_APPLICANT';
  INSERT INTO public.user_roles (user_id, role, institution_id)
    VALUES (v_app.user_id, 'INSTITUTION_ADMIN', v_inst_id)
    ON CONFLICT DO NOTHING;

  UPDATE public.institution_applications
    SET status='APPROVED', institution_id = v_inst_id,
        reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_id;

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
