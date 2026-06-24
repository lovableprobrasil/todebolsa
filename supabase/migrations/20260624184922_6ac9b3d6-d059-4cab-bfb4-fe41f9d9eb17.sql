
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('STUDENT','GUARDIAN','INSTITUTION_USER','INSTITUTION_ADMIN','PLATFORM_SALES','PLATFORM_ADMIN');
CREATE TYPE public.course_level AS ENUM ('FUNDAMENTAL','MEDIO','TECNICO','IDIOMAS','PROFISSIONALIZANTE','CURSO_LIVRE','PREPARATORIO','EJA','PRE_VESTIBULAR','GRADUACAO','POS_GRADUACAO','MBA','MESTRADO');
CREATE TYPE public.course_modality AS ENUM ('PRESENCIAL','SEMIPRESENCIAL','EAD');
CREATE TYPE public.course_shift AS ENUM ('MANHA','TARDE','NOITE','INTEGRAL','FLEXIVEL');
CREATE TYPE public.institution_status AS ENUM ('PENDING','APPROVED','SUSPENDED','REJECTED');
CREATE TYPE public.offering_status AS ENUM ('ACTIVE','PAUSED','SOLD_OUT','ARCHIVED');
CREATE TYPE public.discount_type AS ENUM ('PERCENT','FIXED','FINAL_PRICE');
CREATE TYPE public.reservation_status AS ENUM ('RESERVED','PAYMENT_PENDING','CONFIRMED','UNDER_REVIEW','AWAITING_ENROLLMENT','ENROLLMENT_APPROVED','ENROLLMENT_REJECTED','EXPIRED','CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING','PAID','REFUSED','REFUNDED','CHARGEBACK','CANCELLED');
CREATE TYPE public.lead_status AS ENUM ('NEW','CONTACTED','WAITING','INTERESTED','RESERVATION_STARTED','RESERVATION_DONE','ENROLLMENT_IN_PROGRESS','ENROLLMENT_DONE','LOST');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  birth_date DATE,
  institution_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER_ROLES + has_role ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  institution_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, institution_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INSTITUTIONS ============
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  trade_name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  mec_code TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  status public.institution_status NOT NULL DEFAULT 'PENDING',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read approved institutions" ON public.institutions FOR SELECT TO anon, authenticated USING (status = 'APPROVED');
CREATE POLICY "admins manage institutions" ON public.institutions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_inst_updated BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.institution_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighborhood TEXT,
  zip TEXT,
  phone TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institution_units TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_units TO authenticated;
GRANT ALL ON public.institution_units TO service_role;
ALTER TABLE public.institution_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read units" ON public.institution_units FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage units" ON public.institution_units FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.institution_units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COURSES ============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  level public.course_level NOT NULL,
  modality public.course_modality NOT NULL,
  shift public.course_shift NOT NULL DEFAULT 'FLEXIVEL',
  duration_months INTEGER,
  description TEXT,
  target_audience TEXT,
  prerequisites TEXT,
  original_price NUMERIC(10,2) NOT NULL,
  promotional_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, slug)
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active courses" ON public.courses FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  institution_unit_id UUID NOT NULL REFERENCES public.institution_units(id) ON DELETE CASCADE,
  vacancies_total INTEGER NOT NULL DEFAULT 0,
  vacancies_available INTEGER NOT NULL DEFAULT 0,
  vacancies_reserved INTEGER NOT NULL DEFAULT 0,
  vacancies_sold INTEGER NOT NULL DEFAULT 0,
  vacancies_cancelled INTEGER NOT NULL DEFAULT 0,
  status public.offering_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_offerings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_offerings TO authenticated;
GRANT ALL ON public.course_offerings TO service_role;
ALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read offerings" ON public.course_offerings FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "admins manage offerings" ON public.course_offerings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_off_updated BEFORE UPDATE ON public.course_offerings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SCHOLARSHIPS ============
CREATE TABLE public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discount_type public.discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  price_with_scholarship NUMERIC(10,2) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  rules TEXT,
  required_documents TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholarships TO authenticated;
GRANT ALL ON public.scholarships TO service_role;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active scholarships" ON public.scholarships FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage scholarships" ON public.scholarships FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_sch_updated BEFORE UPDATE ON public.scholarships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CAMPAIGNS ============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  discount_percent INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active campaigns" ON public.campaigns FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_camp_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.campaign_scholarships (
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, scholarship_id)
);
GRANT SELECT ON public.campaign_scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_scholarships TO authenticated;
GRANT ALL ON public.campaign_scholarships TO service_role;
ALTER TABLE public.campaign_scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read campaign_scholarships" ON public.campaign_scholarships FOR SELECT TO anon, authenticated USING (true);

-- ============ FAVORITES / RESERVATIONS / ENROLLMENTS ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id),
  course_offering_id UUID NOT NULL REFERENCES public.course_offerings(id),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  reservation_code TEXT NOT NULL UNIQUE,
  status public.reservation_status NOT NULL DEFAULT 'RESERVED',
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own reservations" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE POLICY "users create own reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update reservations" ON public.reservations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_res_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  status public.reservation_status NOT NULL DEFAULT 'AWAITING_ENROLLMENT',
  uge_card_eligible BOOLEAN NOT NULL DEFAULT false,
  uge_card_issued_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_enr_updated BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MISC ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  course_interest TEXT,
  source TEXT,
  status public.lead_status NOT NULL DEFAULT 'NEW',
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales and admin see leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_SALES') OR public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE POLICY "sales and admin manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_SALES') OR public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_SALES') OR public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  author TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "admins manage posts" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_blog_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage faqs" ON public.faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'PLATFORM_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'PLATFORM_ADMIN'));
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED MOCK DATA ============
-- Instituições
INSERT INTO public.institutions (id, slug, trade_name, legal_name, cnpj, description, email, phone, website, mec_code, rating, status, is_featured) VALUES
('11111111-1111-1111-1111-111111111111','universidade-horizonte','Universidade Horizonte','Universidade Horizonte S/A','11.111.111/0001-11','Universidade nacional com foco em graduação e pós-graduação presencial e EAD.','contato@horizonte.edu.br','(11) 3000-1000','https://horizonte.edu.br','12345',4.7,'APPROVED',true),
('22222222-2222-2222-2222-222222222222','escola-novo-saber','Escola Novo Saber','Instituto Novo Saber Ltda','22.222.222/0001-22','Escola de ensino fundamental e médio com tradição em educação de qualidade.','contato@novosaber.com.br','(11) 3000-2000','https://novosaber.com.br',null,4.8,'APPROVED',true),
('33333333-3333-3333-3333-333333333333','tech-pro-cursos','Tech Pro Cursos Técnicos','Tech Pro Educação Ltda','33.333.333/0001-33','Cursos técnicos e profissionalizantes em tecnologia, saúde e administração.','contato@techpro.com.br','(11) 3000-3000','https://techpro.com.br',null,4.6,'APPROVED',true),
('44444444-4444-4444-4444-444444444444','global-idiomas','Global Idiomas','Global Idiomas e Cultura Ltda','44.444.444/0001-44','Escola de idiomas com método imersivo presencial e online.','contato@globalidiomas.com.br','(11) 3000-4000','https://globalidiomas.com.br',null,4.9,'APPROVED',true),
('55555555-5555-5555-5555-555555555555','instituto-prepara','Instituto Prepara','Instituto Prepara Educacional Ltda','55.555.555/0001-55','Pré-vestibular, preparatórios para concursos e EJA.','contato@prepara.com.br','(11) 3000-5000','https://prepara.com.br',null,4.5,'APPROVED',false);

-- Unidades
INSERT INTO public.institution_units (id, institution_id, name, city, state, neighborhood, address, is_main) VALUES
('aaaaaaa1-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Campus São Paulo','São Paulo','SP','Vila Mariana','Av. Paulista, 1000',true),
('aaaaaaa1-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Polo EAD Brasília','Brasília','DF','Asa Norte','SCN Quadra 5',false),
('aaaaaaa1-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Campus Rio de Janeiro','Rio de Janeiro','RJ','Centro','Av. Rio Branco, 200',false),
('aaaaaaa2-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Unidade Pinheiros','São Paulo','SP','Pinheiros','R. dos Pinheiros, 500',true),
('aaaaaaa2-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Unidade Moema','São Paulo','SP','Moema','Av. Ibirapuera, 1500',false),
('aaaaaaa3-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','Unidade Centro','Goiânia','GO','Centro','Av. Goiás, 800',true),
('aaaaaaa3-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','Unidade Tatuapé','São Paulo','SP','Tatuapé','R. Tuiuti, 300',false),
('aaaaaaa4-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','Sede Jardins','São Paulo','SP','Jardins','Al. Santos, 700',true),
('aaaaaaa5-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','Sede Brasília','Brasília','DF','Asa Sul','SCS Quadra 2',true),
('aaaaaaa5-0000-0000-0000-000000000002','55555555-5555-5555-5555-555555555555','Unidade Belo Horizonte','Belo Horizonte','MG','Savassi','R. Antônio de Albuquerque, 100',false);

-- Cursos (20)
INSERT INTO public.courses (id, institution_id, slug, name, level, modality, shift, duration_months, description, original_price, promotional_price, is_active) VALUES
('c0000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','direito','Direito','GRADUACAO','PRESENCIAL','NOITE',60,'Bacharelado em Direito com ênfase em prática jurídica.',1890.00,null,true),
('c0000001-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','psicologia','Psicologia','GRADUACAO','PRESENCIAL','MANHA',60,'Bacharelado em Psicologia.',1750.00,null,true),
('c0000001-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','administracao-ead','Administração EAD','GRADUACAO','EAD','FLEXIVEL',48,'Graduação em Administração 100% online.',690.00,null,true),
('c0000001-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','engenharia-civil','Engenharia Civil','GRADUACAO','PRESENCIAL','NOITE',60,'Bacharelado em Engenharia Civil.',1980.00,null,true),
('c0000001-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','mba-gestao','MBA em Gestão de Negócios','MBA','SEMIPRESENCIAL','NOITE',18,'MBA executivo em gestão e liderança.',1200.00,null,true),
('c0000001-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','pos-marketing-digital','Pós em Marketing Digital','POS_GRADUACAO','EAD','FLEXIVEL',12,'Especialização em marketing digital e dados.',890.00,null,true),
('c0000002-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','ensino-fundamental-2','Ensino Fundamental II','FUNDAMENTAL','PRESENCIAL','MANHA',48,'Ensino fundamental II do 6º ao 9º ano.',1850.00,null,true),
('c0000002-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','ensino-medio','Ensino Médio','MEDIO','PRESENCIAL','MANHA',36,'Ensino médio com foco em ENEM.',2100.00,null,true),
('c0000002-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','ensino-medio-integral','Ensino Médio Integral','MEDIO','PRESENCIAL','INTEGRAL',36,'Ensino médio em período integral.',3200.00,null,true),
('c0000003-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','tecnico-enfermagem','Técnico em Enfermagem','TECNICO','PRESENCIAL','NOITE',24,'Formação técnica em enfermagem reconhecida pelo MEC.',590.00,null,true),
('c0000003-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','tecnico-administracao','Técnico em Administração','TECNICO','SEMIPRESENCIAL','NOITE',18,'Formação técnica em administração.',490.00,null,true),
('c0000003-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','tecnico-ti','Técnico em Informática','TECNICO','PRESENCIAL','TARDE',24,'Formação técnica em desenvolvimento e suporte.',650.00,null,true),
('c0000003-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333','design-grafico','Design Gráfico Profissionalizante','PROFISSIONALIZANTE','PRESENCIAL','NOITE',12,'Curso profissionalizante em design.',420.00,null,true),
('c0000003-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','dev-web-livre','Desenvolvimento Web','CURSO_LIVRE','EAD','FLEXIVEL',9,'Curso livre completo de desenvolvimento web.',380.00,null,true),
('c0000004-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','ingles','Inglês','IDIOMAS','PRESENCIAL','FLEXIVEL',24,'Curso de inglês do básico ao avançado.',480.00,null,true),
('c0000004-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444','espanhol','Espanhol','IDIOMAS','PRESENCIAL','FLEXIVEL',18,'Curso completo de espanhol.',420.00,null,true),
('c0000004-0000-0000-0000-000000000003','44444444-4444-4444-4444-444444444444','frances-online','Francês Online','IDIOMAS','EAD','FLEXIVEL',18,'Curso de francês 100% online.',360.00,null,true),
('c0000005-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','pre-vestibular','Pré-Vestibular Intensivo','PRE_VESTIBULAR','PRESENCIAL','NOITE',12,'Curso preparatório para vestibulares e ENEM.',780.00,null,true),
('c0000005-0000-0000-0000-000000000002','55555555-5555-5555-5555-555555555555','eja-medio','EJA Ensino Médio','EJA','SEMIPRESENCIAL','NOITE',18,'EJA para conclusão do ensino médio.',290.00,null,true),
('c0000005-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555','prep-concursos','Preparatório Concursos','PREPARATORIO','EAD','FLEXIVEL',12,'Preparatório online para concursos públicos.',340.00,null,true);

-- Offerings (uma por curso, alguns com unidade variada)
INSERT INTO public.course_offerings (id, course_id, institution_unit_id, vacancies_total, vacancies_available, status) VALUES
('0ff00001-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000001','aaaaaaa1-0000-0000-0000-000000000001',60,42,'ACTIVE'),
('0ff00001-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000002','aaaaaaa1-0000-0000-0000-000000000001',50,30,'ACTIVE'),
('0ff00001-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000003','aaaaaaa1-0000-0000-0000-000000000002',500,310,'ACTIVE'),
('0ff00001-0000-0000-0000-000000000004','c0000001-0000-0000-0000-000000000004','aaaaaaa1-0000-0000-0000-000000000003',40,18,'ACTIVE'),
('0ff00001-0000-0000-0000-000000000005','c0000001-0000-0000-0000-000000000005','aaaaaaa1-0000-0000-0000-000000000001',45,22,'ACTIVE'),
('0ff00001-0000-0000-0000-000000000006','c0000001-0000-0000-0000-000000000006','aaaaaaa1-0000-0000-0000-000000000002',200,140,'ACTIVE'),
('0ff00002-0000-0000-0000-000000000001','c0000002-0000-0000-0000-000000000001','aaaaaaa2-0000-0000-0000-000000000001',30,12,'ACTIVE'),
('0ff00002-0000-0000-0000-000000000002','c0000002-0000-0000-0000-000000000002','aaaaaaa2-0000-0000-0000-000000000001',40,21,'ACTIVE'),
('0ff00002-0000-0000-0000-000000000003','c0000002-0000-0000-0000-000000000003','aaaaaaa2-0000-0000-0000-000000000002',25,8,'ACTIVE'),
('0ff00003-0000-0000-0000-000000000001','c0000003-0000-0000-0000-000000000001','aaaaaaa3-0000-0000-0000-000000000001',60,35,'ACTIVE'),
('0ff00003-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000002','aaaaaaa3-0000-0000-0000-000000000001',50,25,'ACTIVE'),
('0ff00003-0000-0000-0000-000000000003','c0000003-0000-0000-0000-000000000003','aaaaaaa3-0000-0000-0000-000000000002',45,20,'ACTIVE'),
('0ff00003-0000-0000-0000-000000000004','c0000003-0000-0000-0000-000000000004','aaaaaaa3-0000-0000-0000-000000000002',30,15,'ACTIVE'),
('0ff00003-0000-0000-0000-000000000005','c0000003-0000-0000-0000-000000000005','aaaaaaa3-0000-0000-0000-000000000001',300,210,'ACTIVE'),
('0ff00004-0000-0000-0000-000000000001','c0000004-0000-0000-0000-000000000001','aaaaaaa4-0000-0000-0000-000000000001',80,55,'ACTIVE'),
('0ff00004-0000-0000-0000-000000000002','c0000004-0000-0000-0000-000000000002','aaaaaaa4-0000-0000-0000-000000000001',60,40,'ACTIVE'),
('0ff00004-0000-0000-0000-000000000003','c0000004-0000-0000-0000-000000000003','aaaaaaa4-0000-0000-0000-000000000001',150,110,'ACTIVE'),
('0ff00005-0000-0000-0000-000000000001','c0000005-0000-0000-0000-000000000001','aaaaaaa5-0000-0000-0000-000000000001',100,70,'ACTIVE'),
('0ff00005-0000-0000-0000-000000000002','c0000005-0000-0000-0000-000000000002','aaaaaaa5-0000-0000-0000-000000000002',80,45,'ACTIVE'),
('0ff00005-0000-0000-0000-000000000003','c0000005-0000-0000-0000-000000000003','aaaaaaa5-0000-0000-0000-000000000001',200,180,'ACTIVE');

-- Scholarships (uma por offering com descontos variados)
INSERT INTO public.scholarships (course_offering_id, title, discount_type, discount_value, price_with_scholarship, rules, is_featured) VALUES
('0ff00001-0000-0000-0000-000000000001','Bolsa Direito 60% OFF','PERCENT',60,756.00,'Para novos alunos. Manutenção exige aproveitamento mínimo de 75%.',true),
('0ff00001-0000-0000-0000-000000000002','Bolsa Psicologia 55% OFF','PERCENT',55,787.50,'Aplicável à mensalidade. Renovação semestral.',false),
('0ff00001-0000-0000-0000-000000000003','Bolsa EAD 70% OFF','PERCENT',70,207.00,'Bolsa válida para todo o curso.',true),
('0ff00001-0000-0000-0000-000000000004','Bolsa Engenharia 50% OFF','PERCENT',50,990.00,'Para vestibulandos com nota acima de 600 no ENEM.',false),
('0ff00001-0000-0000-0000-000000000005','MBA Promocional 65% OFF','PERCENT',65,420.00,'Vagas limitadas para a próxima turma.',true),
('0ff00001-0000-0000-0000-000000000006','Pós Marketing 80% OFF','PERCENT',80,178.00,'Bolsa de campanha — vagas limitadas.',true),
('0ff00002-0000-0000-0000-000000000001','Bolsa Fundamental 40% OFF','PERCENT',40,1110.00,'Para novos alunos matriculados até o início do ano letivo.',false),
('0ff00002-0000-0000-0000-000000000002','Bolsa Ensino Médio 50% OFF','PERCENT',50,1050.00,'Inclui material didático.',true),
('0ff00002-0000-0000-0000-000000000003','Bolsa Integral 35% OFF','PERCENT',35,2080.00,'Bolsa para o período integral.',false),
('0ff00003-0000-0000-0000-000000000001','Bolsa Enfermagem 70% OFF','PERCENT',70,177.00,'Reconhecida pelo MEC. Vagas limitadas.',true),
('0ff00003-0000-0000-0000-000000000002','Bolsa Administração 75% OFF','PERCENT',75,122.50,'Semipresencial. Aulas 2x por semana.',false),
('0ff00003-0000-0000-0000-000000000003','Bolsa TI 65% OFF','PERCENT',65,227.50,'Inclui certificação Microsoft.',true),
('0ff00003-0000-0000-0000-000000000004','Design Gráfico 60% OFF','PERCENT',60,168.00,'Bolsa promocional.',false),
('0ff00003-0000-0000-0000-000000000005','Dev Web 85% OFF','PERCENT',85,57.00,'Curso 100% online com mentoria.',true),
('0ff00004-0000-0000-0000-000000000001','Inglês 55% OFF','PERCENT',55,216.00,'Material incluso.',true),
('0ff00004-0000-0000-0000-000000000002','Espanhol 50% OFF','PERCENT',50,210.00,'Promoção volta às aulas.',false),
('0ff00004-0000-0000-0000-000000000003','Francês Online 60% OFF','PERCENT',60,144.00,'100% online.',false),
('0ff00005-0000-0000-0000-000000000001','Pré-Vestibular 70% OFF','PERCENT',70,234.00,'Inclui simulados e correção de redação.',true),
('0ff00005-0000-0000-0000-000000000002','EJA 90% OFF','PERCENT',90,29.00,'Bolsa social para conclusão do ensino médio.',true),
('0ff00005-0000-0000-0000-000000000003','Concursos 65% OFF','PERCENT',65,119.00,'Materiais atualizados.',false);

-- Campanhas
INSERT INTO public.campaigns (name, description, discount_percent, is_active) VALUES
('Volta às Aulas 2026','Descontos imperdíveis em escolas e cursos para todas as idades.',60,true),
('Campanha EAD','Até 85% OFF em cursos a distância.',85,true),
('Até 90% de Desconto','Bolsas selecionadas com desconto máximo.',90,true);

-- FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('Como funciona a bolsa de estudo do Tô de Bolsa?','Você escolhe a bolsa desejada, faz sua reserva e segue para a matrícula direto com a instituição. Pagando menos do início ao fim do curso.','Geral',1),
('Posso usar bolsas para escolas e faculdades?','Sim. Temos bolsas para ensino fundamental, médio, técnico, idiomas, profissionalizantes, graduação, pós, MBA e mais.','Geral',2),
('Como funciona a carteira de estudante UGE?','Após a matrícula confirmada, você fica elegível à carteira de estudante digital emitida pela UGE - União Geral dos Estudantes do Brasil.','Benefícios',3),
('A bolsa vale durante todo o curso?','Sim, desde que cumpridas as regras de manutenção definidas pela instituição (como aproveitamento mínimo).','Bolsas',4),
('Preciso pagar alguma taxa para reservar?','Algumas bolsas exigem taxa simbólica de reserva para garantir a vaga. Isso fica claro antes da confirmação.','Reservas',5),
('A bolsa pode ser cancelada?','Sim, conforme regras de cada instituição. Você pode acompanhar tudo pelo seu painel.','Reservas',6);

-- Blog seed
INSERT INTO public.blog_posts (slug, title, excerpt, content, author) VALUES
('como-conseguir-bolsa-de-estudo','Como conseguir bolsa de estudo em 2026','Guia completo para encontrar bolsas em escolas, faculdades, cursos técnicos e idiomas.','Conteúdo completo do guia...','Equipe Tô de Bolsa'),
('melhores-cursos-tecnicos','Os melhores cursos técnicos para começar a trabalhar rápido','Conheça as áreas técnicas com maior empregabilidade no Brasil.','Conteúdo completo...','Equipe Tô de Bolsa'),
('guia-graduacao-ead','Guia da graduação EAD: vale a pena?','Tudo o que você precisa saber sobre cursar a faculdade a distância.','Conteúdo completo...','Equipe Tô de Bolsa');
