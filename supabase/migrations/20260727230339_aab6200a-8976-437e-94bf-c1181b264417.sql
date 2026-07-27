-- Atualização massiva para banners de imagem única (estilo Quero Bolsa)
-- Usando as referências fornecidas como base para a estrutura

-- Graduação
UPDATE public.homepage_main_banners 
SET 
  image_desktop = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920',
  title = '[IMAGEM ÚNICA] Graduação',
  description = '',
  badge = '',
  cta_label = '',
  theme = '{"focalPoint": "center"}'::jsonb
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO');

-- Pós-graduação
UPDATE public.homepage_main_banners 
SET 
  image_desktop = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1920',
  title = '[IMAGEM ÚNICA] Pós-graduação',
  description = '',
  badge = '',
  cta_label = '',
  theme = '{"focalPoint": "center"}'::jsonb
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO');

-- Microbanners - Removendo sobreposição de texto
UPDATE public.homepage_micro_banners
SET
  title = '[IMAGEM ÚNICA] Microbanner',
  description = '',
  cta_label = ''
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups);

-- Adicionando os banners de referência especificamente para Graduação para teste visual
-- Nota: Usando os assets criados no passo anterior
UPDATE public.homepage_main_banners 
SET 
  image_desktop = '/__l5e/assets-v1/55640270-ac18-485b-8b51-04d37be52f3a/banner-quero-ref1.png'
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO')
AND display_order = 0;

UPDATE public.homepage_main_banners 
SET 
  image_desktop = '/__l5e/assets-v1/1963285e-672c-46ea-85c3-5745c4f99fb0/banner-quero-ref2.png'
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO')
AND display_order = 1;