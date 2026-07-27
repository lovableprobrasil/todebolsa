-- Atualização criativa dos banners para trazer personalidade e identidade
-- Graduação
UPDATE public.homepage_main_banners 
SET 
  title = 'O futuro da sua carreira começa aqui',
  description = 'Descontos exclusivos nas melhores universidades. Estude com flexibilidade e qualidade para conquistar o mercado.',
  image_desktop = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920',
  badge = 'Transformação Digital',
  cta_label = 'Buscar minha Bolsa',
  theme = '{"focalPoint": "center right", "overlayOpacity": 0.4}'::jsonb
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO');

-- Pós-graduação
UPDATE public.homepage_main_banners 
SET 
  title = 'Especialista? Sim, você pode.',
  description = 'MBA e Pós-graduação com condições que valorizam seu currículo. Conecte-se com as tendências do mercado global.',
  image_desktop = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1920',
  badge = 'Liderança e Gestão',
  cta_label = 'Evoluir Carreira',
  theme = '{"focalPoint": "center left", "overlayOpacity": 0.5}'::jsonb
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO');

-- Técnico
UPDATE public.homepage_main_banners 
SET 
  title = 'Pronto para o mercado em tempo recorde',
  description = 'Cursos técnicos focados na prática. Enfermagem, TI, Administração e muito mais com bolsas de até 70%.',
  image_desktop = 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1920',
  badge = 'Foco no Emprego',
  cta_label = 'Ver Cursos Técnicos',
  theme = '{"focalPoint": "center", "overlayOpacity": 0.3}'::jsonb
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO');

-- Microbanners - Graduação (Diversidade e Vida Estudantil)
UPDATE public.homepage_micro_banners
SET
  title = 'Campus Modernos',
  description = 'Infraestrutura completa.',
  image_desktop = 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=600',
  cta_label = 'Conhecer Unidades'
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO') AND display_order = 0;

UPDATE public.homepage_micro_banners
SET
  title = 'Carreira EAD',
  description = 'Estude de onde quiser.',
  image_desktop = 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&q=80&w=600',
  cta_label = 'Ver EAD'
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO') AND display_order = 1;

UPDATE public.homepage_micro_banners
SET
  title = 'Suporte Total',
  description = 'Mentoria profissional.',
  image_desktop = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
  cta_label = 'Saber mais'
WHERE campaign_group_id IN (SELECT id FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO') AND display_order = 2;