
-- Graduação
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('GRADUACAO', 'Graduação', 100, '{"fields": ["area", "course", "institution", "city", "modality", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, badge, cta_label, cta_url, display_order)
SELECT id, 'Comece sua graduação pagando menos', 'Compare faculdades, cursos e modalidades e encontre uma bolsa que combine com seus planos.', 'Bolsas com até 90% de desconto', 'Encontrar minha graduação', '/bolsas?level=GRADUACAO', 1
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'A faculdade certa pode estar mais perto do que você imagina', 'Encontre cursos presenciais, semipresenciais e EAD em instituições parceiras.', 'Ver cursos de graduação', '/bolsas?level=GRADUACAO', 2
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Graduação EAD', 'Estude de onde estiver e organize seus horários.', 'Ver bolsas EAD', '/bolsas?level=GRADUACAO&modality=EAD', 1
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Cursos presenciais', 'Encontre instituições e cursos próximos de você.', 'Ver cursos presenciais', '/bolsas?level=GRADUACAO&modality=PRESENCIAL', 2
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Segunda graduação', 'Amplie suas possibilidades profissionais.', 'Conhecer oportunidades', '/bolsas?level=GRADUACAO', 3
FROM public.homepage_campaign_groups WHERE education_level = 'GRADUACAO';

-- Pós-graduação
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('POS_GRADUACAO', 'Pós-graduação', 90, '{"fields": ["area", "course", "institution", "city", "modality", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, badge, cta_label, cta_url, display_order)
SELECT id, 'Dê o próximo passo na sua carreira', 'Encontre pós-graduações, especializações e MBAs com condições especiais.', 'Invista na sua carreira pagando menos', 'Encontrar minha pós', '/bolsas?level=POS_GRADUACAO', 1
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Pós-graduação EAD', 'Estude com flexibilidade e avance na carreira.', 'Ver opções EAD', '/bolsas?level=POS_GRADUACAO&modality=EAD', 1
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'MBAs e liderança', 'Formações para gestão, negócios e tomada de decisão.', 'Conhecer MBAs', '/bolsas?level=MBA', 2
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Especializações em alta', 'Descubra áreas com grande procura profissional.', 'Ver especializações', '/bolsas?level=POS_GRADUACAO', 3
FROM public.homepage_campaign_groups WHERE education_level = 'POS_GRADUACAO';

-- Técnicos
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('TECNICO', 'Técnico', 80, '{"fields": ["area", "course", "institution", "city", "modality", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, badge, cta_label, cta_url, display_order)
SELECT id, 'Prepare-se para o mercado de trabalho', 'Encontre cursos técnicos com formação prática e mensalidades acessíveis.', 'Formação profissional com economia real', 'Encontrar curso técnico', '/bolsas?level=TECNICO', 1
FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Saúde', 'Conheça cursos técnicos em áreas da saúde.', 'Ver cursos', '/bolsas?level=TECNICO&area=SAUDE', 1
FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Tecnologia', 'Formações práticas para o mercado digital.', 'Explorar tecnologia', '/bolsas?level=TECNICO&area=TECNOLOGIA', 2
FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Administração e serviços', 'Qualificação para diferentes setores profissionais.', 'Conhecer cursos', '/bolsas?level=TECNICO&area=NEGOCIOS', 3
FROM public.homepage_campaign_groups WHERE education_level = 'TECNICO';

-- Escolas
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('ESCOLAS', 'Escolas', 70, '{"fields": ["step", "school", "city", "shift", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Encontre uma escola para cada fase da vida', 'Compare escolas, localidades, propostas pedagógicas e condições especiais.', 'Buscar escolas', '/bolsas?level=FUNDAMENTAL', 1
FROM public.homepage_campaign_groups WHERE education_level = 'ESCOLAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Educação infantil', 'Encontre opções para os primeiros anos de aprendizagem.', 'Ver escolas', '/bolsas?level=FUNDAMENTAL', 1
FROM public.homepage_campaign_groups WHERE education_level = 'ESCOLAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Ensino fundamental', 'Compare instituições e propostas educacionais.', 'Conhecer opções', '/bolsas?level=FUNDAMENTAL', 2
FROM public.homepage_campaign_groups WHERE education_level = 'ESCOLAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Ensino médio e EJA', 'Encontre oportunidades para continuar os estudos.', 'Buscar oportunidades', '/bolsas?level=MEDIO', 3
FROM public.homepage_campaign_groups WHERE education_level = 'ESCOLAS';

-- Cursos Livres
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('CURSOS_LIVRES', 'Cursos Livres', 60, '{"fields": ["course", "area", "institution", "modality", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Aprenda algo novo e amplie suas possibilidades', 'Encontre cursos livres para desenvolver habilidades pessoais e profissionais.', 'Explorar cursos livres', '/bolsas?level=CURSO_LIVRE', 1
FROM public.homepage_campaign_groups WHERE education_level = 'CURSOS_LIVRES';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Tecnologia e inovação', 'Aprenda ferramentas e competências digitais.', 'Ver cursos', '/bolsas?level=CURSO_LIVRE&area=TECNOLOGIA', 1
FROM public.homepage_campaign_groups WHERE education_level = 'CURSOS_LIVRES';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Negócios e carreira', 'Desenvolva habilidades para o ambiente profissional.', 'Conhecer cursos', '/bolsas?level=CURSO_LIVRE&area=NEGOCIOS', 2
FROM public.homepage_campaign_groups WHERE education_level = 'CURSOS_LIVRES';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Criatividade e bem-estar', 'Encontre cursos para projetos pessoais e profissionais.', 'Explorar opções', '/bolsas?level=CURSO_LIVRE&area=ARTES', 3
FROM public.homepage_campaign_groups WHERE education_level = 'CURSOS_LIVRES';

-- Idiomas
INSERT INTO public.homepage_campaign_groups (education_level, title, priority, search_configuration)
VALUES ('IDIOMAS', 'Idiomas', 50, '{"fields": ["course", "level", "school", "modality", "maxPrice"]}');

INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, badge, cta_label, cta_url, display_order)
SELECT id, 'Um novo idioma pode levar você mais longe', 'Encontre cursos presenciais e online para aprender no seu ritmo.', 'Cursos para diferentes níveis e objetivos', 'Encontrar curso de idiomas', '/bolsas?level=IDIOMAS', 1
FROM public.homepage_campaign_groups WHERE education_level = 'IDIOMAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Inglês', 'Cursos para iniciantes, estudantes e profissionais.', 'Ver cursos de inglês', '/bolsas?level=IDIOMAS&q=ingles', 1
FROM public.homepage_campaign_groups WHERE education_level = 'IDIOMAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Espanhol', 'Aprenda um dos idiomas mais falados do mundo.', 'Ver cursos de espanhol', '/bolsas?level=IDIOMAS&q=espanhol', 2
FROM public.homepage_campaign_groups WHERE education_level = 'IDIOMAS';

INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, cta_label, cta_url, display_order)
SELECT id, 'Idiomas online', 'Estude com flexibilidade, onde estiver.', 'Conhecer cursos online', '/bolsas?level=IDIOMAS&modality=EAD', 3
FROM public.homepage_campaign_groups WHERE education_level = 'IDIOMAS';

-- EJA & Outros
INSERT INTO public.homepage_campaign_groups (education_level, title, priority)
VALUES ('EJA', 'EJA', 40);
INSERT INTO public.homepage_campaign_groups (education_level, title, priority)
VALUES ('OUTROS', 'Outros Cursos', 30);
