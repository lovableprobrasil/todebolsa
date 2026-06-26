
-- Bulk scholarship import: audit table + RPC

CREATE TABLE public.scholarship_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text,
  total_rows int NOT NULL DEFAULT 0,
  imported_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'COMPLETED',
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.scholarship_imports TO authenticated;
GRANT ALL ON public.scholarship_imports TO service_role;
ALTER TABLE public.scholarship_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inst admin reads own imports" ON public.scholarship_imports
  FOR SELECT TO authenticated
  USING (public.is_institution_admin(auth.uid(), institution_id) OR public.is_platform_admin());

CREATE POLICY "platform admin all imports" ON public.scholarship_imports
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE INDEX idx_scholarship_imports_inst ON public.scholarship_imports(institution_id, created_at DESC);


CREATE OR REPLACE FUNCTION public.bulk_import_scholarships(
  p_institution_id uuid,
  p_file_name text,
  p_rows jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row jsonb;
  v_idx int := 0;
  v_total int := 0;
  v_imported int := 0;
  v_failed int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_import_id uuid;
  v_unit_id uuid;
  v_main_unit uuid;
  v_course_id uuid;
  v_offering_id uuid;
  v_course_name text;
  v_unit_name text;
  v_city text;
  v_level course_level;
  v_modality course_modality;
  v_shift course_shift;
  v_vagas int;
  v_orig numeric;
  v_final numeric;
  v_pct numeric;
  v_disc_type discount_type;
  v_disc_value numeric;
  v_title text;
  v_start timestamptz;
  v_end timestamptz;
  v_active boolean;
  v_slug text;
  v_err text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.is_institution_admin(v_uid, p_institution_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT id INTO v_main_unit FROM public.institution_units
   WHERE institution_id = p_institution_id
   ORDER BY is_main DESC, created_at ASC LIMIT 1;
  IF v_main_unit IS NULL THEN
    RAISE EXCEPTION 'Cadastre ao menos uma unidade antes de importar bolsas.';
  END IF;

  v_total := jsonb_array_length(p_rows);

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_idx := v_idx + 1;
    v_err := NULL;
    BEGIN
      v_course_name := trim(coalesce(v_row->>'nome_curso',''));
      IF v_course_name = '' THEN RAISE EXCEPTION 'nome_curso é obrigatório'; END IF;

      BEGIN v_level := upper(coalesce(v_row->>'nivel_ensino','GRADUACAO'))::course_level;
      EXCEPTION WHEN others THEN RAISE EXCEPTION 'nivel_ensino inválido (use: GRADUACAO, TECNICO, POS_GRADUACAO, etc.)'; END;

      BEGIN v_modality := upper(coalesce(v_row->>'modalidade','PRESENCIAL'))::course_modality;
      EXCEPTION WHEN others THEN RAISE EXCEPTION 'modalidade inválida (PRESENCIAL, SEMIPRESENCIAL, EAD)'; END;

      BEGIN v_shift := upper(coalesce(v_row->>'turno','FLEXIVEL'))::course_shift;
      EXCEPTION WHEN others THEN RAISE EXCEPTION 'turno inválido (MANHA, TARDE, NOITE, INTEGRAL, FLEXIVEL)'; END;

      v_unit_name := nullif(trim(coalesce(v_row->>'unidade','')),'');
      v_city := nullif(trim(coalesce(v_row->>'cidade','')),'');

      IF v_unit_name IS NOT NULL THEN
        SELECT id INTO v_unit_id FROM public.institution_units
          WHERE institution_id = p_institution_id
            AND (lower(name) = lower(v_unit_name) OR (v_city IS NOT NULL AND lower(city) = lower(v_city)))
          LIMIT 1;
        IF v_unit_id IS NULL THEN v_unit_id := v_main_unit; END IF;
      ELSE
        v_unit_id := v_main_unit;
      END IF;

      v_orig := nullif(replace(replace(coalesce(v_row->>'valor_original',''),'.',''),',','.'),'')::numeric;
      v_final := nullif(replace(replace(coalesce(v_row->>'valor_com_bolsa',''),'.',''),',','.'),'')::numeric;
      v_pct := nullif(replace(coalesce(v_row->>'percentual_desconto',''),',','.'),'')::numeric;

      IF v_orig IS NULL OR v_orig <= 0 THEN RAISE EXCEPTION 'valor_original obrigatório e > 0'; END IF;

      IF v_final IS NULL AND v_pct IS NOT NULL THEN
        v_final := round(v_orig * (1 - v_pct/100.0), 2);
      END IF;
      IF v_final IS NULL THEN RAISE EXCEPTION 'informe valor_com_bolsa ou percentual_desconto'; END IF;
      IF v_final >= v_orig THEN RAISE EXCEPTION 'valor_com_bolsa deve ser menor que valor_original'; END IF;
      IF v_pct IS NULL THEN v_pct := round((1 - v_final/v_orig) * 100, 2); END IF;
      IF v_pct <= 0 OR v_pct > 100 THEN RAISE EXCEPTION 'percentual_desconto deve estar entre 1 e 100'; END IF;

      v_vagas := nullif(coalesce(v_row->>'quantidade_bolsas','1'),'')::int;
      IF v_vagas IS NULL OR v_vagas < 1 THEN v_vagas := 1; END IF;

      v_start := coalesce(nullif(v_row->>'data_inicio_oferta','')::timestamptz, now());
      v_end := nullif(v_row->>'data_fim_oferta','')::timestamptz;
      IF v_end IS NOT NULL AND v_end <= v_start THEN RAISE EXCEPTION 'data_fim_oferta deve ser maior que data_inicio_oferta'; END IF;

      v_active := coalesce(lower(coalesce(v_row->>'status','ativa')) IN ('ativa','active','ativo','true','1'), true);

      -- find or create course
      SELECT id INTO v_course_id FROM public.courses
        WHERE institution_id = p_institution_id
          AND lower(name) = lower(v_course_name)
          AND level = v_level
          AND modality = v_modality
          AND shift = v_shift
        LIMIT 1;

      IF v_course_id IS NULL THEN
        v_slug := regexp_replace(lower(public.unaccent_safe(v_course_name)), '[^a-z0-9]+', '-', 'g')
                 || '-' || lower(v_level::text) || '-' || lower(v_modality::text);
        v_slug := trim(both '-' from v_slug);
        -- ensure unique within institution
        IF EXISTS (SELECT 1 FROM public.courses WHERE institution_id = p_institution_id AND slug = v_slug) THEN
          v_slug := v_slug || '-' || substring(md5(random()::text),1,4);
        END IF;
        INSERT INTO public.courses (institution_id, slug, name, level, modality, shift, original_price, is_active)
        VALUES (p_institution_id, v_slug, v_course_name, v_level, v_modality, v_shift, v_orig, true)
        RETURNING id INTO v_course_id;
      END IF;

      -- find or create offering for this course+unit
      SELECT id INTO v_offering_id FROM public.course_offerings
        WHERE course_id = v_course_id AND institution_unit_id = v_unit_id LIMIT 1;
      IF v_offering_id IS NULL THEN
        INSERT INTO public.course_offerings (course_id, institution_unit_id, vacancies_total, vacancies_available, status)
        VALUES (v_course_id, v_unit_id, v_vagas, v_vagas, 'ACTIVE')
        RETURNING id INTO v_offering_id;
      ELSE
        UPDATE public.course_offerings
          SET vacancies_total = vacancies_total + v_vagas,
              vacancies_available = vacancies_available + v_vagas
        WHERE id = v_offering_id;
      END IF;

      v_title := nullif(trim(coalesce(v_row->>'titulo_bolsa','')),'');
      IF v_title IS NULL THEN v_title := 'Bolsa ' || v_pct::text || '% - ' || v_course_name; END IF;

      v_disc_type := 'PERCENT';
      v_disc_value := v_pct;

      -- prevent duplicate identical scholarships
      IF EXISTS (
        SELECT 1 FROM public.scholarships
        WHERE course_offering_id = v_offering_id
          AND title = v_title
          AND price_with_scholarship = v_final
          AND coalesce(end_at, 'infinity'::timestamptz) = coalesce(v_end,'infinity'::timestamptz)
      ) THEN
        RAISE EXCEPTION 'Bolsa duplicada (mesmo curso, título, valor e período)';
      END IF;

      INSERT INTO public.scholarships (
        course_offering_id, title, discount_type, discount_value,
        price_with_scholarship, start_at, end_at, max_uses,
        rules, is_active
      ) VALUES (
        v_offering_id, v_title, v_disc_type, v_disc_value,
        v_final, v_start, v_end, v_vagas,
        nullif(v_row->>'observacoes',''), v_active
      );

      v_imported := v_imported + 1;
    EXCEPTION WHEN others THEN
      v_failed := v_failed + 1;
      v_err := SQLERRM;
      v_errors := v_errors || jsonb_build_object(
        'linha', v_idx,
        'motivo', v_err,
        'dados', v_row
      );
    END;
  END LOOP;

  INSERT INTO public.scholarship_imports (
    institution_id, user_id, file_name, total_rows, imported_count, failed_count,
    status, errors
  ) VALUES (
    p_institution_id, v_uid, p_file_name, v_total, v_imported, v_failed,
    CASE WHEN v_failed = 0 THEN 'COMPLETED' WHEN v_imported = 0 THEN 'FAILED' ELSE 'PARTIAL' END,
    v_errors
  ) RETURNING id INTO v_import_id;

  RETURN jsonb_build_object(
    'import_id', v_import_id,
    'total', v_total,
    'imported', v_imported,
    'failed', v_failed,
    'errors', v_errors
  );
END $$;

GRANT EXECUTE ON FUNCTION public.bulk_import_scholarships(uuid, text, jsonb) TO authenticated;
