-- Primeiro, garantimos que todos os grupos de campanha existam e estejam ativos
INSERT INTO public.homepage_campaign_groups (education_level, title, status, priority, search_configuration)
VALUES 
  ('ESCOLAS', 'Escolas', 'ACTIVE', 70, '{"fields": ["city", "institution"]}'),
  ('PROFISSIONALIZANTE', 'Profissionalizante', 'ACTIVE', 60, '{"fields": ["area", "city"]}'),
  ('EJA', 'EJA', 'ACTIVE', 50, '{"fields": ["city"]}'),
  ('CURSO_LIVRE', 'Cursos Livres', 'ACTIVE', 40, '{"fields": ["area", "city"]}'),
  ('IDIOMAS', 'Idiomas', 'ACTIVE', 30, '{"fields": ["language", "city"]}'),
  ('OUTROS', 'Mais Cursos', 'ACTIVE', 20, '{"fields": ["q", "city"]}')
ON CONFLICT (education_level) DO UPDATE 
SET status = 'ACTIVE', title = EXCLUDED.title;

-- Limpeza de banners órfãos ou sem imagem para as categorias que o usuário reclamou
DELETE FROM public.homepage_main_banners WHERE image_desktop IS NULL OR image_desktop = '';
DELETE FROM public.homepage_micro_banners WHERE image_desktop IS NULL OR image_desktop = '';

-- Função auxiliar para inserir banners e microbanners consistentes
DO $$
DECLARE
    group_record RECORD;
    banner_id UUID;
BEGIN
    FOR group_record IN SELECT id, education_level, title FROM public.homepage_campaign_groups LOOP
        
        -- Inserir 3 Banners Principais por categoria se não houver
        IF (SELECT count(*) FROM public.homepage_main_banners WHERE campaign_group_id = group_record.id) < 3 THEN
            INSERT INTO public.homepage_main_banners (campaign_group_id, title, description, badge, image_desktop, cta_label, cta_url, display_order)
            VALUES 
            (group_record.id, group_record.title || ' - Descontos de até 90%', 'Aproveite as melhores oportunidades para sua carreira.', 'OFERTA EXCLUSIVA', 'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=1200', 'GARANTIR BOLSA', '/bolsas', 1),
            (group_record.id, group_record.title || ' - Estude onde quiser', 'Milhares de instituições parceiras em todo o Brasil.', 'NOVIDADE', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200', 'VER BOLSAS', '/bolsas', 2),
            (group_record.id, group_record.title || ' - Transforme seu futuro', 'Educação de qualidade com preços que cabem no bolso.', 'DESTAQUE', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200', 'COMEÇAR AGORA', '/bolsas', 3);
        END IF;

        -- Inserir 3 Microbanners por categoria (Sincronizados)
        IF (SELECT count(*) FROM public.homepage_micro_banners WHERE campaign_group_id = group_record.id) < 3 THEN
            INSERT INTO public.homepage_micro_banners (campaign_group_id, title, description, image_desktop, cta_url, display_order)
            VALUES 
            (group_record.id, 'Até 90% OFF', group_record.title, 'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=600', '/bolsas', 1),
            (group_record.id, 'Novas Vagas', group_record.title, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600', '/bolsas', 2),
            (group_record.id, 'Melhores Preços', group_record.title, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600', '/bolsas', 3);
        END IF;
    END LOOP;
END $$;
