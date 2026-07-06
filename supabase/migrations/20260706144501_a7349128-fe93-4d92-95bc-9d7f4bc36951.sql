
DO $$ BEGIN
  CREATE TYPE public.duration_unit AS ENUM ('HORAS','MESES','ANOS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS duration_value numeric,
  ADD COLUMN IF NOT EXISTS duration_unit public.duration_unit;

DROP FUNCTION IF EXISTS public.institution_save_scholarship(uuid, uuid, text, text, text, text, text, uuid, numeric, text, numeric, int, timestamptz, text, boolean, int, text, int);

CREATE OR REPLACE FUNCTION public.institution_save_scholarship(
  p_scholarship_id uuid,
  p_institution_id uuid,
  p_title text,
  p_level text,
  p_modality text,
  p_shift text,
  p_area text,
  p_institution_unit_id uuid,
  p_original_price numeric,
  p_discount_type text,
  p_discount_value numeric,
  p_vacancies int,
  p_end_at timestamptz,
  p_rules text,
  p_is_active boolean,
  p_duration_months int DEFAULT NULL,
  p_price_mode text DEFAULT 'MONTHLY',
  p_installments_count int DEFAULT NULL,
  p_duration_value numeric DEFAULT NULL,
  p_duration_unit text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_unit_id uuid := p_institution_unit_id;
  v_course_id uuid;
  v_offering_id uuid;
  v_existing_course_id uuid;
  v_final numeric;
  v_slug text;
  v_level course_level;
  v_modality course_modality;
  v_shift course_shift;
  v_scholarship_id uuid := p_scholarship_id;
  v_price_mode public.scholarship_price_mode;
  v_duration_unit public.duration_unit;
  v_duration_months int := p_duration_months;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (public.is_institution_admin(v_uid, p_institution_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN RAISE EXCEPTION 'Informe o nome do curso.'; END IF;

  v_level := p_level::course_level;
  v_modality := p_modality::course_modality;
  v_shift := COALESCE(NULLIF(p_shift,''), 'FLEXIVEL')::course_shift;
  v_price_mode := COALESCE(NULLIF(p_price_mode,''),'MONTHLY')::public.scholarship_price_mode;
  v_duration_unit := NULLIF(p_duration_unit,'')::public.duration_unit;

  -- Derive canonical duration_months from value+unit when provided
  IF p_duration_value IS NOT NULL AND v_duration_unit IS NOT NULL THEN
    v_duration_months := CASE v_duration_unit
      WHEN 'HORAS' THEN GREATEST(1, CEIL(p_duration_value / 160.0)::int)
      WHEN 'MESES' THEN CEIL(p_duration_value)::int
      WHEN 'ANOS'  THEN CEIL(p_duration_value * 12)::int
    END;
  END IF;

  -- Unit rules: EAD → optional. Others → optional too; if none, use first unit.
  IF v_unit_id IS NULL THEN
    IF v_modality = 'EAD' THEN
      v_unit_id := public.ensure_ead_unit(p_institution_id);
    ELSE
      SELECT id INTO v_unit_id FROM public.institution_units
        WHERE institution_id = p_institution_id
        ORDER BY is_main DESC, created_at ASC LIMIT 1;
      IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Cadastre ao menos uma unidade antes de criar bolsas presenciais/semipresenciais.';
      END IF;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.institution_units WHERE id = v_unit_id AND institution_id = p_institution_id) THEN
      RAISE EXCEPTION 'Unidade inválida.';
    END IF;
  END IF;

  IF p_original_price IS NULL OR p_original_price <= 0 THEN RAISE EXCEPTION 'Informe o valor do curso/mensalidade.'; END IF;

  IF p_discount_type = 'PERCENT' THEN
    IF p_discount_value IS NULL OR p_discount_value <= 0 OR p_discount_value > 100 THEN RAISE EXCEPTION 'Percentual de desconto deve estar entre 1 e 100.'; END IF;
    v_final := round(p_original_price * (1 - p_discount_value/100.0), 2);
  ELSIF p_discount_type = 'FIXED' THEN
    IF p_discount_value IS NULL OR p_discount_value <= 0 THEN RAISE EXCEPTION 'Informe o valor de desconto.'; END IF;
    v_final := round(p_original_price - p_discount_value, 2);
  ELSE
    RAISE EXCEPTION 'Tipo de desconto inválido.';
  END IF;
  IF v_final < 0 OR v_final >= p_original_price THEN
    RAISE EXCEPTION 'O valor com desconto deve ser menor que o valor original.';
  END IF;

  IF v_scholarship_id IS NOT NULL THEN
    SELECT c.id INTO v_existing_course_id
    FROM public.scholarships s
    JOIN public.course_offerings co ON co.id = s.course_offering_id
    JOIN public.courses c ON c.id = co.course_id
    JOIN public.institution_units u ON u.id = co.institution_unit_id
    WHERE s.id = v_scholarship_id AND u.institution_id = p_institution_id;

    IF v_existing_course_id IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;

    UPDATE public.courses SET
      name = p_title,
      level = v_level,
      modality = v_modality,
      shift = v_shift,
      original_price = p_original_price,
      area = NULLIF(p_area,''),
      duration_months = COALESCE(v_duration_months, duration_months)
    WHERE id = v_existing_course_id;

    v_course_id := v_existing_course_id;
  ELSE
    SELECT id INTO v_course_id FROM public.courses
      WHERE institution_id = p_institution_id
        AND lower(name) = lower(p_title)
        AND level = v_level AND modality = v_modality AND shift = v_shift
      LIMIT 1;

    IF v_course_id IS NULL THEN
      v_slug := regexp_replace(lower(public.unaccent_safe(p_title)), '[^a-z0-9]+', '-', 'g')
                || '-' || lower(p_level) || '-' || lower(p_modality);
      v_slug := trim(both '-' from v_slug);
      IF EXISTS (SELECT 1 FROM public.courses WHERE institution_id = p_institution_id AND slug = v_slug) THEN
        v_slug := v_slug || '-' || substring(md5(random()::text),1,4);
      END IF;
      INSERT INTO public.courses (institution_id, slug, name, level, modality, shift, original_price, area, duration_months, is_active)
      VALUES (p_institution_id, v_slug, p_title, v_level, v_modality, v_shift, p_original_price, NULLIF(p_area,''), v_duration_months, true)
      RETURNING id INTO v_course_id;
    ELSE
      UPDATE public.courses
        SET original_price = p_original_price,
            area = COALESCE(NULLIF(p_area,''), area),
            duration_months = COALESCE(v_duration_months, duration_months)
      WHERE id = v_course_id;
    END IF;
  END IF;

  SELECT id INTO v_offering_id FROM public.course_offerings
    WHERE course_id = v_course_id AND institution_unit_id = v_unit_id LIMIT 1;
  IF v_offering_id IS NULL THEN
    INSERT INTO public.course_offerings (course_id, institution_unit_id, vacancies_total, vacancies_available, status)
    VALUES (v_course_id, v_unit_id, GREATEST(COALESCE(p_vacancies,1),1), GREATEST(COALESCE(p_vacancies,1),1), 'ACTIVE')
    RETURNING id INTO v_offering_id;
  END IF;

  IF v_scholarship_id IS NULL THEN
    INSERT INTO public.scholarships (
      course_offering_id, title, discount_type, discount_value,
      price_with_scholarship, end_at, rules, max_uses, is_active,
      duration_months, price_mode, installments_count,
      duration_value, duration_unit
    ) VALUES (
      v_offering_id, p_title, p_discount_type::discount_type, p_discount_value,
      v_final, p_end_at, NULLIF(p_rules,''), GREATEST(COALESCE(p_vacancies,1),1), COALESCE(p_is_active,true),
      v_duration_months, v_price_mode, p_installments_count,
      p_duration_value, v_duration_unit
    ) RETURNING id INTO v_scholarship_id;
  ELSE
    UPDATE public.scholarships SET
      course_offering_id = v_offering_id,
      title = p_title,
      discount_type = p_discount_type::discount_type,
      discount_value = p_discount_value,
      price_with_scholarship = v_final,
      end_at = p_end_at,
      rules = NULLIF(p_rules,''),
      max_uses = GREATEST(COALESCE(p_vacancies,1),1),
      is_active = COALESCE(p_is_active, is_active),
      duration_months = COALESCE(v_duration_months, duration_months),
      price_mode = v_price_mode,
      installments_count = COALESCE(p_installments_count, installments_count),
      duration_value = COALESCE(p_duration_value, duration_value),
      duration_unit = COALESCE(v_duration_unit, duration_unit)
    WHERE id = v_scholarship_id;
  END IF;

  RETURN v_scholarship_id;
END $$;
