import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, IdCard, ShieldCheck, Users, Award, Star, Percent, Search, Sparkles, Building2, MapPin, GraduationCap, BookOpen, CalendarClock, FileText, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { ScholarshipCardSkeleton } from "@/components/site/ScholarshipCardSkeleton";
import { SectionState } from "@/components/site/SectionState";
import { SearchBar } from "@/components/site/SearchBar";
import { TrustBadges } from "@/components/site/TrustBadges";
import { StudentTestimonials } from "@/components/site/StudentTestimonials";
import { BlogHomeSection } from "@/components/site/BlogHomeSection";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { listScholarships, listFaqs, listInstitutionsBestOffer, listCoursesBestOffer, getPlatformStats } from "@/lib/scholarships";
import { formatBRL, COURSE_LEVEL_LABEL } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import heroStudent from "@/assets/hero-student-new.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tô de Bolsa — Educação acessível com até 90% de desconto" },
      { name: "description", content: "Encontre bolsas para faculdade, escola, técnico e idiomas. Oportunidades para todas as idades e carteira de estudante digital UGE." },
      { property: "og:title", content: "Tô de Bolsa — Até 90% de desconto em bolsas de estudo" },
      { property: "og:description", content: "Marketplace nacional de bolsas de estudo para todas as idades e níveis de ensino." },
      { property: "og:url", content: "https://todebolsa.lovable.app/" },
      { name: "twitter:title", content: "Tô de Bolsa — Até 90% de desconto em bolsas de estudo" },
      { name: "twitter:description", content: "Marketplace nacional de bolsas de estudo para todas as idades e níveis de ensino." },
    ],
    links: [
      { rel: "canonical", href: "https://todebolsa.lovable.app/" },
      { rel: "preload", as: "image", href: heroStudent, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Tô de Bolsa",
          url: "https://todebolsa.lovable.app",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://todebolsa.lovable.app/bolsas?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

const POPULAR = [
  "Direito", "Administração", "Psicologia", "Pedagogia", "Enfermagem", "Engenharia de Software",
];

const CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília",
  "Curitiba", "Porto Alegre", "Salvador", "Fortaleza",
];

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Hero + busca principal */}
        <HeroCarousel />
        <HomeSearch />

        {/* 2. Faixa de confiança */}
        <TrustBadges />

        {/* 3. Instituições parceiras */}
        <InstitutionsSection />

        {/* 4. Categorias mais procuradas */}
        <CategorySection />

        {/* 5. Bolsas em destaque */}
        <FeaturedSection />

        {/* Cursos com bolsas (extensão de destaques) */}
        <CoursesSection />

        {/* 6. Como funciona */}
        <HowItWorks />

        {/* 7. Carteira de Estudante UGE */}
        <UgeCallout />

        {/* Benefícios da plataforma */}
        <BenefitsSection />

        {/* 8. Avaliações / depoimentos */}
        <StudentTestimonials />

        {/* 9. Bolsas por cidade */}
        <CitiesSection />

        {/* Números da plataforma */}
        <StatsBar />

        {/* 10. Chamada para instituições */}
        <CtaInstitution />

        {/* 11. Perguntas frequentes */}
        <FaqSection />

        {/* Guia do estudante */}
        <BlogHomeSection />
      </main>
      <Footer />
    </div>
  );
}

function HomeSearch() {
  return (
    <section id="busca-bolsas" className="relative bg-gradient-to-b from-hero to-background -mt-px scroll-mt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-2 pb-10">
        <SearchBar />
      </div>
    </section>
  );
}





function PopularBar() {
  return (
    <div className="relative -mt-8 md:-mt-10 z-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-muted-foreground shrink-0">Popular:</span>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <Link
                key={p}
                to="/bolsas"
                search={{ q: p }}
                className="inline-flex items-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
          O que deseja estudar?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Encontre bolsas por categoria, curso e cidade
        </p>
      </div>
      <CategoryGrid />
    </section>
  );
}

function StatsBar() {
  const { data } = useQuery({ queryKey: ["platform-stats"], queryFn: getPlatformStats });
  if (!data) return null;
  const stats: { value: string; label: string }[] = [];
  if (data.scholarships > 0) stats.push({ value: data.scholarships.toLocaleString("pt-BR"), label: data.scholarships === 1 ? "Bolsa ativa" : "Bolsas ativas" });
  if (data.institutions > 0) stats.push({ value: data.institutions.toLocaleString("pt-BR"), label: data.institutions === 1 ? "Instituição parceira" : "Instituições parceiras" });
  if (data.vacancies > 0) stats.push({ value: data.vacancies.toLocaleString("pt-BR"), label: "Vagas disponíveis" });
  if (data.maxDiscount > 0) stats.push({ value: `Até ${data.maxDiscount}%`, label: "De desconto" });
  if (stats.length === 0) return null;
  return (
    <section className="bg-brand-blue text-brand-blue-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className={`grid gap-6 ${stats.length >= 4 ? "grid-cols-2 md:grid-cols-4" : stats.length === 3 ? "grid-cols-1 sm:grid-cols-3" : stats.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-extrabold text-primary">{s.value}</div>
              <div className="mt-1 text-sm opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["scholarships", "featured"],
    queryFn: () => listScholarships({ featuredOnly: true, limit: 6 }),
  });

  const items = data ?? [];

  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <Star className="h-3.5 w-3.5 fill-primary" />
              Bolsas em destaque
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              As melhores oportunidades selecionadas para você
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/bolsas">
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ScholarshipCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <SectionState
            variant="error"
            title="Não foi possível carregar as bolsas em destaque"
            description="Verifique sua conexão e tente novamente."
            action={{ label: "Tentar novamente", onClick: () => void refetch() }}
          />
        ) : items.length === 0 ? (
          <SectionState
            variant="empty"
            title="Nenhuma bolsa em destaque no momento"
            description="Explore todas as ofertas disponíveis na busca completa."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <ScholarshipCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Search,
      title: "Encontre",
      text: "Busque por curso, cidade, modalidade ou instituição e descubra bolsas disponíveis em todo o Brasil.",
    },
    {
      n: "02",
      icon: Sparkles,
      title: "Compare",
      text: "Veja mensalidade, desconto, avaliações e condições lado a lado antes de escolher a bolsa ideal para você.",
    },
    {
      n: "03",
      icon: Award,
      title: "Garanta",
      text: "Reserve sua vaga direto pela plataforma. Depois é só concluir a matrícula com a instituição parceira.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          Como funciona
        </span>
        <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold">
          Encontre, compare e garanta sua bolsa
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Três passos simples para descobrir a oportunidade certa. A finalização
          do pagamento acontece em uma etapa separada, com dados, revisão e
          confirmação.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-5xl font-extrabold text-primary/15 leading-none">{s.n}</div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary mt-4 mb-3">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Após reservar, o checkout ocorre em 4 etapas: dados, detalhes da bolsa,
        pagamento e revisão.
      </p>
    </section>
  );
}

function UgeCallout() {
  const infos = [
    {
      icon: CheckCircle2,
      title: "Quem pode emitir",
      text: "Estudantes matriculados em instituições parceiras via Tô de Bolsa em cursos regulares reconhecidos.",
    },
    {
      icon: GraduationCap,
      title: "Cursos cobertos",
      text: "Educação básica, técnico, graduação, pós-graduação, cursos livres e idiomas ofertados pelas parceiras.",
    },
    {
      icon: CalendarClock,
      title: "Emissão e validade",
      text: "Emitida após a confirmação da matrícula, com validade anual conforme o vínculo com a instituição.",
    },
    {
      icon: FileText,
      title: "Documentos necessários",
      text: "CPF, foto recente e comprovante de matrícula fornecido pela instituição parceira.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-hero text-hero-foreground p-8 md:p-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] items-start">
          <div className="min-w-0">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground mb-4">
              <IdCard className="h-7 w-7" />
            </span>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-3">
              Carteira de Estudante Digital — UGE
            </h3>
            <p className="text-hero-muted max-w-xl">
              Ao concluir sua matrícula por uma instituição parceira via Tô de
              Bolsa, você pode solicitar a{" "}
              <strong className="text-hero-foreground">
                Carteira de Estudante Digital
              </strong>{" "}
              emitida pela{" "}
              <strong className="text-hero-foreground">
                UGE — União Geral dos Estudantes do Brasil
              </strong>
              . Ela dá direito a meia-entrada em cinema, shows, teatros e
              eventos culturais, conforme a Lei nº 12.933/2013.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg" className="shrink-0" asChild>
                <Link to="/bolsas">Buscar bolsas</Link>
              </Button>
              <Button size="lg" variant="outline" className="shrink-0 bg-transparent border-hero-foreground/30 text-hero-foreground hover:bg-hero-foreground/10" asChild>
                <Link to="/carteira-uge">Saiba mais sobre a UGE</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-hero-muted">
              Emissão sujeita à confirmação de matrícula e ao envio dos
              documentos exigidos pela UGE.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {infos.map((i) => (
              <li
                key={i.title}
                className="rounded-2xl bg-hero-foreground/5 border border-hero-foreground/10 p-4"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <i.icon className="h-4 w-4" />
                </span>
                <h4 className="font-bold text-sm text-hero-foreground mb-1">
                  {i.title}
                </h4>
                <p className="text-xs text-hero-muted leading-relaxed">
                  {i.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const items = [
    { icon: Percent, title: "Até 90% de desconto", text: "Economize na mensalidade com bolsas exclusivas em todo o Brasil." },
    { icon: Search, title: "Busca rápida e fácil", text: "Encontre por curso, cidade, modalidade e categoria em segundos." },
    { icon: Users, title: "Para todas as idades", text: "Crianças, jovens, adultos e idosos — oportunidades para todos." },
    { icon: IdCard, title: "Carteira digital UGE", text: "Ao concluir a matrícula, receba sua carteira digital emitida pela UGE." },
  ];
  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">
            Por que escolher o Tô de Bolsa?
          </h2>
          <p className="mt-3 text-muted-foreground">Benefícios exclusivos para quem busca educação com economia</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <div key={b.title} className="rounded-2xl bg-card border border-border p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary mb-4">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstitutionsSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["institutions", "best-offer"],
    queryFn: () => listInstitutionsBestOffer(10),
  });
  const items = data ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-blue mb-2">
            <Building2 className="h-3.5 w-3.5" />
            Instituições parceiras
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">
            Bolsas nas melhores instituições
          </h2>
          <p className="mt-2 text-muted-foreground">
            Clique em uma instituição e veja todas as bolsas disponíveis nas unidades cadastradas.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/bolsas">Ver todas <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[180px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <SectionState
          variant="error"
          title="Não foi possível carregar as instituições"
          description="Tente novamente em instantes."
          action={{ label: "Tentar novamente", onClick: () => void refetch() }}
        />
      ) : items.length === 0 ? (
        <SectionState
          variant="empty"
          title="Nenhuma instituição parceira disponível ainda"
          description="Volte em breve — novas parcerias entram toda semana."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((i) => (
            <Link
              key={i.id}
              to="/instituicoes/$slug"
              params={{ slug: i.slug }}
              onClick={() =>
                void trackEvent("institution_click", {
                  entityType: "institution",
                  entityId: i.id,
                  metadata: { slug: i.slug, trade_name: i.trade_name },
                })
              }
              className="group rounded-2xl border border-border bg-card p-4 flex flex-col hover:border-primary hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="h-20 flex items-center justify-center mb-3">
                {i.logo_url ? (
                  <img
                    src={i.logo_url}
                    alt={`Logo ${i.trade_name}`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-16 max-w-[80%] object-contain"
                  />
                ) : (
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary font-display font-extrabold text-lg">
                    {i.trade_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-3 text-center">
                <div className="text-xs text-muted-foreground leading-tight">
                  Bolsas de até <span className="font-bold text-primary">{i.bestDiscount}%</span>
                </div>
                <div className="text-xs text-muted-foreground leading-tight mt-1">
                  A partir de <span className="font-bold text-primary">{formatBRL(i.minPrice)}</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground text-center truncate">
                {i.trade_name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CoursesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses", "best-offer"],
    queryFn: () => listCoursesBestOffer(10),
  });
  const items = data ?? [];

  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              Cursos com bolsas
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Cursos com bolsas de estudo
            </h2>
            <p className="mt-2 text-muted-foreground">
              Os cursos mais procurados — descontos disponíveis em diversas instituições parceiras.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/bolsas">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[170px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <SectionState
            variant="error"
            title="Não foi possível carregar os cursos"
            description="Tente novamente em instantes."
            action={{ label: "Tentar novamente", onClick: () => void refetch() }}
          />
        ) : items.length === 0 ? (
          <SectionState
            variant="empty"
            title="Nenhum curso disponível ainda"
            description="Novos cursos são publicados frequentemente. Volte em breve."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((c) => (
              <Link
                key={c.name}
                to="/bolsas"
                search={{ q: c.name }}
                onClick={() =>
                  void trackEvent("course_click", {
                    entityType: "course",
                    entityId: c.name,
                    metadata: { level: c.level },
                  })
                }
                className="group rounded-2xl border border-border bg-card p-5 flex flex-col hover:border-primary hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="font-display font-extrabold text-sm uppercase leading-tight line-clamp-2 text-foreground">
                    {c.name}
                  </div>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-auto space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Bolsas de até <span className="font-bold text-primary">{c.bestDiscount}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    A partir de <span className="font-bold text-primary">{formatBRL(c.minPrice)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1">
                    {COURSE_LEVEL_LABEL[c.level] ?? c.level} · {c.scholarshipCount} {c.scholarshipCount === 1 ? "bolsa" : "bolsas"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CitiesSection() {
  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">Bolsas por cidade</h2>
          <p className="mt-3 text-muted-foreground">Encontre oportunidades nas principais cidades do Brasil</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CITIES.map((city) => (
            <Link
              key={city}
              to="/bolsas"
              search={{ city }}
              onClick={() =>
                void trackEvent("city_click", {
                  entityType: "city",
                  entityId: city,
                })
              }
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <MapPin className="h-3.5 w-3.5" />
                Cidade
              </div>
              <div className="font-display font-bold text-lg">{city}</div>
              <div className="mt-2 text-sm text-primary font-semibold inline-flex items-center gap-1">
                Ver bolsas <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { data } = useQuery({ queryKey: ["faqs"], queryFn: listFaqs });
  const faqs = (data ?? []).slice(0, 5);
  if (!faqs.length) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold">Perguntas frequentes</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f) => (
          <AccordionItem key={f.id} value={f.id}>
            <AccordionTrigger className="text-left font-semibold">{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="text-center mt-6">
        <Button variant="outline" asChild>
          <Link to="/faq">Ver todas as perguntas</Link>
        </Button>
      </div>
    </section>
  );
}

function CtaInstitution() {
  const benefits = ["Cadastro gratuito", "Painel completo de gestão", "Acompanhe suas vagas em tempo real"];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-semibold mb-3">
            <Building2 className="h-3.5 w-3.5" />
            Para instituições
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-3">
            É uma instituição de ensino?
          </h3>
          <p className="text-muted-foreground mb-5 max-w-2xl">
            Cadastre sua instituição, publique suas bolsas e alcance estudantes que estão
            buscando oportunidades reais. Aumente suas matrículas e preencha suas vagas.
          </p>
          <ul className="grid sm:grid-cols-3 gap-3 max-w-2xl">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <Button size="lg" className="bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90 shrink-0" asChild>
          <Link to="/para-instituicoes">Cadastrar instituição</Link>
        </Button>
      </div>
    </section>
  );
}
