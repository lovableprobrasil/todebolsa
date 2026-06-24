
-- helper
CREATE OR REPLACE FUNCTION public.is_platform_admin(_uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'PLATFORM_ADMIN'::app_role)
$$;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

-- admins can read everything that matters for moderation
DROP POLICY IF EXISTS "admins read all profiles" ON public.profiles;
CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "admins read all roles" ON public.user_roles;
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "admins read all reservations" ON public.reservations;
CREATE POLICY "admins read all reservations" ON public.reservations
  FOR SELECT TO authenticated USING (public.is_platform_admin());

-- ============ ADMIN ACTIONS ============

CREATE OR REPLACE FUNCTION public.set_institution_status(p_institution_id uuid, p_status institution_status)
RETURNS public.institutions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.institutions%ROWTYPE; v_admin uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institutions SET status = p_status WHERE id = p_institution_id RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Instituição não encontrada'; END IF;

  FOR v_admin IN
    SELECT user_id FROM public.user_roles
     WHERE role='INSTITUTION_ADMIN' AND institution_id = p_institution_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (v_admin, 'INSTITUTION_STATUS',
      CASE p_status
        WHEN 'APPROVED' THEN 'Instituição aprovada ✅'
        WHEN 'REJECTED' THEN 'Cadastro recusado'
        WHEN 'SUSPENDED' THEN 'Instituição suspensa'
        ELSE 'Status atualizado'
      END,
      'O status da sua instituição agora é ' || p_status::text || '.',
      '/instituicao/' || p_institution_id::text);
  END LOOP;

  RETURN v_row;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_institution_status(uuid, institution_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_institution_status(uuid, institution_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_institution_feature(p_institution_id uuid, p_featured boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.institutions SET is_featured = p_featured WHERE id = p_institution_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.toggle_institution_feature(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_institution_feature(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_scholarship_feature(p_scholarship_id uuid, p_featured boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.scholarships SET is_featured = p_featured WHERE id = p_scholarship_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.toggle_scholarship_feature(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_scholarship_feature(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id uuid, p_role app_role, p_institution_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_roles (user_id, role, institution_id)
  VALUES (p_user_id, p_role, p_institution_id)
  ON CONFLICT DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_user_role(p_user_id uuid, p_role app_role, p_institution_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_role = 'STUDENT' THEN RAISE EXCEPTION 'Não é permitido remover a role STUDENT'; END IF;
  DELETE FROM public.user_roles
   WHERE user_id = p_user_id AND role = p_role
     AND (p_institution_id IS NULL OR institution_id = p_institution_id);
END $$;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role, uuid) TO authenticated;

-- ============ ADMIN DASHBOARD ============
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT jsonb_build_object(
    'institutions_total', (SELECT count(*) FROM public.institutions),
    'institutions_pending', (SELECT count(*) FROM public.institutions WHERE status='PENDING'),
    'institutions_approved', (SELECT count(*) FROM public.institutions WHERE status='APPROVED'),
    'institutions_suspended', (SELECT count(*) FROM public.institutions WHERE status='SUSPENDED'),
    'scholarships_active', (SELECT count(*) FROM public.scholarships WHERE is_active=true),
    'scholarships_total', (SELECT count(*) FROM public.scholarships),
    'students_total', (SELECT count(*) FROM public.user_roles WHERE role='STUDENT'),
    'reservations_total', (SELECT count(*) FROM public.reservations),
    'reservations_pending', (SELECT count(*) FROM public.reservations WHERE status IN ('RESERVED','PAYMENT_PENDING')),
    'reservations_confirmed', (SELECT count(*) FROM public.reservations WHERE status='CONFIRMED'),
    'reservations_expired', (SELECT count(*) FROM public.reservations WHERE status='EXPIRED'),
    'gmv_paid', (SELECT COALESCE(SUM(amount),0) FROM public.payment_attempts WHERE status='PAID'),
    'payments_count', (SELECT count(*) FROM public.payment_attempts WHERE status='PAID'),
    'recent_signups', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'recent_reservations', (SELECT count(*) FROM public.reservations WHERE created_at > now() - interval '7 days')
  ) INTO v;

  RETURN v::json;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;

-- list users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users(p_search text DEFAULT NULL, p_limit int DEFAULT 50, p_offset int DEFAULT 0)
RETURNS TABLE(id uuid, name text, email text, phone text, avatar_url text, created_at timestamptz, roles app_role[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
    SELECT p.id, p.name, p.email, p.phone, p.avatar_url, p.created_at,
           COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::app_role[]) AS roles
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p_search IS NULL
       OR p.name ILIKE '%'||p_search||'%'
       OR p.email ILIKE '%'||p_search||'%'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, int, int) TO authenticated;
