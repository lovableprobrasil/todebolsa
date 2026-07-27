-- 1. Limpar banners existentes para evitar duplicação ou conflitos de estilo antigo
TRUNCATE public.homepage_main_banners CASCADE;
TRUNCATE public.homepage_micro_banners CASCADE;

-- 2. Garantir que os grupos de campanha existam para todas as 9 categorias
INSERT INTO public.homepage_campaign_groups (education_level, title, status)
VALUES 
  ('GRADUACAO', 'Graduação', 'ACTIVE'),
  ('POS_GRADUACAO', 'Pós-graduação', 'ACTIVE'),
  ('TECNICO', 'Técnico', 'ACTIVE'),
  ('ESCOLAS', 'Escolas', 'ACTIVE'),
  ('PROFISSIONALIZANTE', 'Profissionalizante', 'ACTIVE'),
  ('EJA', 'EJA', 'ACTIVE'),
  ('CURSO_LIVRE', 'Cursos Livres', 'ACTIVE'),
  ('IDIOMAS', 'Idiomas', 'ACTIVE'),
  ('OUTROS', 'Mais cursos', 'ACTIVE')
ON CONFLICT (education_level) DO UPDATE SET status = 'ACTIVE';

-- 3. Inserir Banners Principais (Imagens Únicas com texto integrado)
-- Graduação
INSERT INTO public.homepage_main_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Graduação - Realize seu sonho', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

-- Pós-graduação
INSERT INTO public.homepage_main_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Pós-graduação - Seja um especialista', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1920', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';

-- Técnico
INSERT INTO public.homepage_main_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Cursos Técnicos - Prática para o mercado', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1920', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO';

-- Escolas
INSERT INTO public.homepage_main_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Escolas - O melhor futuro para seu filho', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1920', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'ESCOLAS';

-- 4. Inserir Microbanners (3 para cada categoria principal)
-- Graduação
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Melhores Faculdades', 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=600', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Cursos EAD', 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&q=80&w=600', 1, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Bolsas 90%', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600', 2, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

-- Pós-graduação
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'MBA Executivo', 'https://images.unsplash.com/photo-1454165833767-0274b0696734?auto=format&fit=crop&q=80&w=600', 0, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Especialização em TI', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600', 1, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';
INSERT INTO public.homepage_micro_banners (campaign_group_id, title, image_desktop, display_order, status, cta_url)
SELECT id, 'Saúde e Bem-estar', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600', 2, 'ACTIVE', '/bolsas'
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';