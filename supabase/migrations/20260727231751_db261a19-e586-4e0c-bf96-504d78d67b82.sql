DO $$
DECLARE
    grad_id uuid := 'd37461dd-f41e-4a7d-a94e-97bbb7cdad29';
    pos_id uuid := '1ef36b5d-9a59-4492-a870-b18f383d1848';
    tec_id uuid := '6c80ffb0-a3a6-4ee2-9756-d8b4301ac8bf';
    esc_id uuid := '51953cdf-ce96-4e15-a81f-d8edb5218a91';
BEGIN
    DELETE FROM homepage_main_banners WHERE campaign_group_id IN (grad_id, pos_id, tec_id, esc_id);
    DELETE FROM homepage_micro_banners WHERE campaign_group_id IN (grad_id, pos_id, tec_id, esc_id);

    -- GRADUAÇÃO
    INSERT INTO homepage_main_banners (campaign_group_id, title, description, image_desktop, display_order, cta_url, status)
    VALUES 
    (grad_id, 'Graduação', 'Ganhe descontos de até 90%', 'https://images.unsplash.com/photo-1523050335456-c38a89b7ed28?auto=format&fit=crop&q=80&w=1920', 0, '/bolsas', 'ACTIVE'),
    (grad_id, 'Amplie sua Carreira', 'A graduação que você sempre quis', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920', 1, '/bolsas', 'ACTIVE'),
    (grad_id, 'Marketplace de Bolsas', 'Onde seus sonhos ganham forma', 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1920', 2, '/bolsas', 'ACTIVE');

    -- PÓS-GRADUAÇÃO
    INSERT INTO homepage_main_banners (campaign_group_id, title, description, image_desktop, display_order, cta_url, status)
    VALUES 
    (pos_id, 'Pós-graduação', 'Especialização com desconto exclusivo', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1920', 0, '/bolsas', 'ACTIVE'),
    (pos_id, 'Destaque Profissional', 'Seja um especialista na sua área', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920', 1, '/bolsas', 'ACTIVE'),
    (pos_id, 'Conhecimento', 'Transforme sua carreira hoje', 'https://images.unsplash.com/photo-1454165833767-0274b0696734?auto=format&fit=crop&q=80&w=1920', 2, '/bolsas', 'ACTIVE');

    -- TÉCNICO
    INSERT INTO homepage_main_banners (campaign_group_id, title, description, image_desktop, display_order, cta_url, status)
    VALUES 
    (tec_id, 'Curso Técnico', 'Formação rápida para o mercado', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1920', 0, '/bolsas', 'ACTIVE'),
    (tec_id, 'Empregue-se', 'A bolsa que faltava para seu sucesso', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1920', 1, '/bolsas', 'ACTIVE'),
    (tec_id, 'Seu Futuro', 'Prática e excelência em educação', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1920', 2, '/bolsas', 'ACTIVE');

    -- MICROBANNERS (Repetindo os principais)
    INSERT INTO homepage_micro_banners (campaign_group_id, title, description, image_desktop, display_order, cta_url, status)
    VALUES 
    (grad_id, 'Descontos de 90%', 'Na graduação dos seus sonhos', 'https://images.unsplash.com/photo-1523050335456-c38a89b7ed28?auto=format&fit=crop&q=80&w=600', 0, '/bolsas', 'ACTIVE'),
    (grad_id, 'Amplie sua Carreira', 'Invista no seu futuro hoje', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600', 1, '/bolsas', 'ACTIVE'),
    (grad_id, 'Bolsas Incríveis', 'O melhor marketplace de estudos', 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=600', 2, '/bolsas', 'ACTIVE'),
    
    (pos_id, 'Pós com Desconto', 'Especialização para você', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600', 0, '/bolsas', 'ACTIVE'),
    (pos_id, 'Seja Especialista', 'Destaque-se no mercado de trabalho', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600', 1, '/bolsas', 'ACTIVE'),
    (pos_id, 'Pós Premium', 'Conhecimento que abre portas', 'https://images.unsplash.com/photo-1454165833767-0274b0696734?auto=format&fit=crop&q=80&w=600', 2, '/bolsas', 'ACTIVE');
END $$;