CREATE TABLE public.homepage_campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 0,
    audience JSONB,
    location JSONB,
    search_configuration JSONB,
    recommendation_configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.homepage_main_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_group_id UUID REFERENCES public.homepage_campaign_groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    image_desktop TEXT,
    image_mobile TEXT,
    alt_text TEXT,
    cta_label TEXT,
    cta_url TEXT,
    target_type TEXT,
    target_id TEXT,
    filters JSONB,
    theme JSONB,
    display_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.homepage_micro_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_group_id UUID REFERENCES public.homepage_campaign_groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_desktop TEXT,
    image_mobile TEXT,
    alt_text TEXT,
    cta_label TEXT,
    cta_url TEXT,
    target_type TEXT,
    target_id TEXT,
    filters JSONB,
    theme JSONB,
    display_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_campaign_groups TO authenticated;
GRANT SELECT ON public.homepage_campaign_groups TO anon;
GRANT ALL ON public.homepage_campaign_groups TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_main_banners TO authenticated;
GRANT SELECT ON public.homepage_main_banners TO anon;
GRANT ALL ON public.homepage_main_banners TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_micro_banners TO authenticated;
GRANT SELECT ON public.homepage_micro_banners TO anon;
GRANT ALL ON public.homepage_micro_banners TO service_role;

-- RLS
ALTER TABLE public.homepage_campaign_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_main_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_micro_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read campaign groups" ON public.homepage_campaign_groups FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "Admins manage campaign groups" ON public.homepage_campaign_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'PLATFORM_ADMIN'));

CREATE POLICY "Public read main banners" ON public.homepage_main_banners FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "Admins manage main banners" ON public.homepage_main_banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'PLATFORM_ADMIN'));

CREATE POLICY "Public read micro banners" ON public.homepage_micro_banners FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "Admins manage micro banners" ON public.homepage_micro_banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'PLATFORM_ADMIN'));

