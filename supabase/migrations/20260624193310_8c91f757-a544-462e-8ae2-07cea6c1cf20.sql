
-- 1. Helper: is_institution_admin
CREATE OR REPLACE FUNCTION public.is_institution_admin(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'INSTITUTION_ADMIN'
      AND institution_id = _institution_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_institution_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_admin(uuid, uuid) TO authenticated;

-- 2. RLS — institutions: admin can SELECT/UPDATE their own
CREATE POLICY "inst admin reads own institution"
ON public.institutions FOR SELECT TO authenticated
USING (public.is_institution_admin(auth.uid(), id));

CREATE POLICY "inst admin updates own institution"
ON public.institutions FOR UPDATE TO authenticated
USING (public.is_institution_admin(auth.uid(), id))
WITH CHECK (public.is_institution_admin(auth.uid(), id) AND status <> 'APPROVED' OR public.is_institution_admin(auth.uid(), id));

-- 3. RLS — institution_units
CREATE POLICY "inst admin manages own units"
ON public.institution_units FOR ALL TO authenticated
USING (public.is_institution_admin(auth.uid(), institution_id))
WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

-- 4. RLS — courses
CREATE POLICY "inst admin manages own courses"
ON public.courses FOR ALL TO authenticated
USING (public.is_institution_admin(auth.uid(), institution_id))
WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

-- 5. RLS — course_offerings (via unit -> institution)
CREATE POLICY "inst admin manages own offerings"
ON public.course_offerings FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.institution_units u
  WHERE u.id = institution_unit_id
    AND public.is_institution_admin(auth.uid(), u.institution_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.institution_units u
  WHERE u.id = institution_unit_id
    AND public.is_institution_admin(auth.uid(), u.institution_id)
));

-- 6. RLS — scholarships (via offering -> unit -> institution)
CREATE POLICY "inst admin manages own scholarships"
ON public.scholarships FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.course_offerings co
  JOIN public.institution_units u ON u.id = co.institution_unit_id
  WHERE co.id = course_offering_id
    AND public.is_institution_admin(auth.uid(), u.institution_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.course_offerings co
  JOIN public.institution_units u ON u.id = co.institution_unit_id
  WHERE co.id = course_offering_id
    AND public.is_institution_admin(auth.uid(), u.institution_id)
));

-- 7. RPC to claim/onboard a new institution
CREATE OR REPLACE FUNCTION public.claim_institution(
  p_trade_name text,
  p_legal_name text,
  p_cnpj text,
  p_email text,
  p_phone text,
  p_website text,
  p_description text,
  p_unit_name text,
  p_city text,
  p_state text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inst_id uuid;
  v_slug text;
  v_base_slug text;
  v_n int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- slugify trade name (basic)
  v_base_slug := regexp_replace(lower(unaccent_safe(p_trade_name)), '[^a-z0-9]+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);
  IF v_base_slug = '' THEN v_base_slug := 'instituicao'; END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.institutions WHERE slug = v_slug) LOOP
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n::text;
  END LOOP;

  INSERT INTO public.institutions (slug, trade_name, legal_name, cnpj, email, phone, website, description, status, is_featured)
  VALUES (v_slug, p_trade_name, NULLIF(p_legal_name,''), NULLIF(p_cnpj,''), NULLIF(p_email,''), NULLIF(p_phone,''), NULLIF(p_website,''), NULLIF(p_description,''), 'PENDING', false)
  RETURNING id INTO v_inst_id;

  INSERT INTO public.institution_units (institution_id, name, city, state, is_main)
  VALUES (v_inst_id, COALESCE(NULLIF(p_unit_name,''), 'Unidade principal'), p_city, p_state, true);

  INSERT INTO public.user_roles (user_id, role, institution_id)
  VALUES (v_uid, 'INSTITUTION_ADMIN', v_inst_id)
  ON CONFLICT DO NOTHING;

  RETURN v_inst_id;
END;
$$;

-- helper to slugify even without unaccent extension
CREATE OR REPLACE FUNCTION public.unaccent_safe(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(p,
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN'
  )
$$;
REVOKE EXECUTE ON FUNCTION public.unaccent_safe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unaccent_safe(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_institution(text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_institution(text,text,text,text,text,text,text,text,text,text) TO authenticated;
