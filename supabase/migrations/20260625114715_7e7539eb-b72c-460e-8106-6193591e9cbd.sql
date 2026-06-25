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
    '/instituicao');

  RETURN v_row;
END $$;

-- Atualiza notificações existentes para apontar para o portal da instituição
UPDATE public.notifications
   SET link = '/instituicao'
 WHERE type = 'INSTITUTION_APPLICATION'
   AND link = '/instituicao/credenciamento'
   AND title ILIKE 'Cadastro enviado%';