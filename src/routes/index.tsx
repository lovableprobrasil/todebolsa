import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, IdCard, Search, Sparkles, Award } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer, TrustStrip } from "@/components/site/Footer";
import { ScholarshipMiniCard } from "@/components/site/ScholarshipMiniCard";
import { RowCarousel, SectionHeading } from "@/components/site/RowCarousel";
import { SectionState } from "@/components/site/SectionState";
import { BlogHomeSection } from "@/components/site/BlogHomeSection";
import { HeroCarousel, MicrobannersSection } from "@/components/site/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  listScholarships,
  listFaqs,
  listInstitutionsBestOffer,
  listCoursesBestOffer,
  getPlatformStats,
} from "@/lib/scholarships";
import { formatBRL } from "@/lib/format";
import { courseImage } from "@/lib/course-images";
import { trackEvent } from "@/lib/analytics";
import heroStudent from "@/assets/hero-student-new.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tô de Bolsa — Bolsas de estudo com até 90% de desconto" },
      { name: "description", content: "Encontre bolsas para faculdade, escola, técnico e idiomas em todo o Brasil. Compare mensalidades, garanta seu desconto e emita a carteira de estudante digital UGE." },
      { property: "og:title", content: "Tô de Bolsa — Bolsas de estudo com até 90% de desconto" },
      { property: "og:description", content: "Marketplace nacional de bolsas de estudo para todas as idades e níveis de ensino." },
      { property: "og:url", content: "https://todebolsa.lovable.app/" },
      { name: "twitter:title", content: "Tô de Bolsa — Bolsas de estudo com até 90% de desconto" },
      { name: "twitter:description", content: "Marketplace nacional de bolsas de estudo para todas as idades e níveis de ensino." },
    ],
    links: [
      { rel: "canonical", href: "https://todebolsa.lovable.app/" },
      { rel: "preload", as: "image", href: heroStudent },
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

const SHELL = "mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8";

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Banner de campanha com busca embutida */}
        <HeroCarousel />

        {/* 2. Microbanners da campanha */}

        <MicrobannersSection />

        {/* 4. Prateleiras de conteúdo */}
        <InterestingScholarships />
        <CoursesShelf />
        <InstitutionsShelf />
        <CourseDirectory />
        <EadShelf />
        <PartnerLogos />

        {/* 5. Conteúdo editorial */}
        <BlogHomeSection />

        {/* 6. UGE + instituições + FAQ */}
        <UgeCallout />
        <StatsBar />
        <CtaInstitution />
        <FaqSection />
      </main>
      <TrustStrip />
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- shelves */

function InterestingScholarships() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["scholarships", "home-interesting"],
    queryFn: () => listScholarships({ limit: 12, sort: "discount-desc" }),
  });
  const items = data ?? [];

  return (
    <section className={`${SHELL} py-10`}>
      <SectionHeading
        title="Bolsas interessantes para você"
        subtitle={items.length ? `Mostrando ${items.length} das melhores ofertas do momento` : undefined}
      />
      {isLoading ? (
        <ShelfSkeleton />
      ) : isError ? (
        <SectionState
          variant="error"
          title="Não foi possível carregar as bolsas"
          description="Verifique sua conexão e tente novamente."
          action={{ label: "Tentar novamente", onClick: () => void refetch() }}
        />
      ) : items.length === 0 ? (
        <SectionState
          variant="empty"
          title="Nenhuma bolsa disponível no momento"
          description="Novas oportunidades são publicadas toda semana."
        />
      ) : (
        <RowCarousel itemClassName="w-[280px] sm:w-[300px]">
          {items.map((s) => (
            <ScholarshipMiniCard key={s.id} s={s} />
          ))}
        </RowCarousel>
      )}
    </section>
  );
}

function EadShelf() {
  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "home-ead"],
    queryFn: () => listScholarships({ limit: 12, modality: "EAD", sort: "discount-desc" }),
  });
  const items = data ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={`${SHELL} py-10`}>
      <SectionHeading
        title="Já pensou em fazer um curso a distância (EaD)?"
        subtitle="Estude de onde estiver, com mensalidades ainda menores"
        action={
          <Button variant="link" asChild className="text-primary">
            <Link to="/bolsas" search={{ modality: "EAD" }}>
              Ver todas as bolsas EaD
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <ShelfSkeleton />
      ) : (
        <RowCarousel itemClassName="w-[280px] sm:w-[300px]">
          {items.map((s) => (
            <ScholarshipMiniCard key={s.id} s={s} />
          ))}
        </RowCarousel>
      )}
    </section>
  );
}

function CoursesShelf() {
  const { data, isLoading } = useQuery({
    queryKey: ["courses", "best-offer", 12],
    queryFn: () => listCoursesBestOffer(12),
  });
  const items = data ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={`${SHELL} py-10`}>
      <SectionHeading
        title="Cursos com bolsas de estudo"
        subtitle={items.length ? `Bolsas em ${items.length} cursos mais procurados` : undefined}
        action={
          <Button variant="link" asChild className="text-primary">
            <Link to="/bolsas">Ver todos os cursos</Link>
          </Button>
        }
      />
      {isLoading ? (
        <ShelfSkeleton />
      ) : (
        <RowCarousel itemClassName="w-[240px] sm:w-[260px]">
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
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
            >
              <img
                src={courseImage(c.name)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-[140px] w-full object-cover"
              />
              <div className="flex flex-1 flex-col items-center justify-between p-4 text-center">
                <h3 className="font-semibold leading-snug text-brand-ink line-clamp-2">{c.name}</h3>
                <div className="mt-4 text-sm text-muted-foreground">
                  A partir de
                  <div className="font-display text-base font-extrabold text-brand-ink">
                    {formatBRL(c.minPrice)}/mês
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </RowCarousel>
      )}
    </section>
  );
}

function InstitutionsShelf() {
  const { data, isLoading } = useQuery({
    queryKey: ["institutions", "best-offer", 12],
    queryFn: () => listInstitutionsBestOffer(12),
  });
  const items = data ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={`${SHELL} py-10`}>
      <SectionHeading
        title="Instituições com bolsa de estudo"
        subtitle={items.length ? `${items.length} instituições parceiras com vagas abertas` : undefined}
        action={
          <Button variant="link" asChild className="text-primary">
            <Link to="/bolsas">Ver todas as instituições</Link>
          </Button>
        }
      />
      {isLoading ? (
        <ShelfSkeleton />
      ) : (
        <RowCarousel itemClassName="w-[260px] sm:w-[280px]">
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
              className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex h-16 items-center justify-center">
                {i.logo_url ? (
                  <img
                    src={i.logo_url}
                    alt={`Logo ${i.trade_name}`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-14 max-w-[75%] object-contain"
                  />
                ) : (
                  <span className="font-display text-lg font-extrabold text-brand-blue">
                    {i.trade_name}
                  </span>
                )}
              </div>
              <div className="mt-4 font-semibold text-brand-ink line-clamp-2">{i.trade_name}</div>
              <div className="mt-4 flex items-start gap-2 text-left text-sm text-muted-foreground">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {i.scholarshipCount} {i.scholarshipCount === 1 ? "bolsa disponível" : "bolsas disponíveis"} · até{" "}
                  <strong className="text-brand-ink">{i.bestDiscount}%</strong> de desconto
                </span>
              </div>
              <div className="mt-4 border-t border-border pt-4 text-sm font-medium text-brand-ink">
                A partir de {formatBRL(i.minPrice)}/mês
              </div>
            </Link>
          ))}
        </RowCarousel>
      )}
    </section>
  );
}

function CourseDirectory() {
  const { data } = useQuery({
    queryKey: ["courses", "directory"],
    queryFn: () => listCoursesBestOffer(12),
  });
  const items = data ?? [];
  if (items.length === 0) return null;

  return (
    <section className={`${SHELL} py-10`}>
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h2 className="font-display text-2xl md:text-[28px] font-extrabold tracking-tight text-brand-ink">
            Em dúvida sobre qual curso fazer?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Veja informações sobre duração do curso, modalidade, mensalidade média, instituições
            parceiras e muito mais.
          </p>
        </div>
        <form
          className="flex items-center gap-2 rounded-xl border border-input bg-card px-4 h-12"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            placeholder="Digite o curso"
            aria-label="Pesquisar por curso"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => (
          <Link
            key={c.name}
            to="/bolsas"
            search={{ q: c.name }}
            className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
          >
            <img
              src={courseImage(c.name)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[120px] w-full object-cover"
            />
            <div className="flex min-h-[64px] items-center justify-center p-3 text-center text-sm font-medium text-brand-ink">
              {c.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PartnerLogos() {
  const { data } = useQuery({
    queryKey: ["institutions", "logos"],
    queryFn: () => listInstitutionsBestOffer(16),
  });
  const items = (data ?? []).filter((i) => i.logo_url);
  if (items.length === 0) return null;

  return (
    <section className={`${SHELL} py-10`}>
      <SectionHeading title="As melhores instituições estão no Tô de Bolsa" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((i) => (
          <Link
            key={i.id}
            to="/instituicoes/$slug"
            params={{ slug: i.slug }}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
          >
            <img
              src={i.logo_url!}
              alt={`Logo ${i.trade_name}`}
              loading="lazy"
              decoding="async"
              className="h-12 max-w-[70%] object-contain"
            />
            <span className="text-center text-sm font-semibold text-brand-ink line-clamp-1">
              {i.trade_name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShelfSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[220px] w-[280px] shrink-0 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- institutional */

function UgeCallout() {
  return (
    <section className={`${SHELL} py-10`}>
      <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-hero)] p-8 text-hero-foreground md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-hero-foreground/15">
              <IdCard className="h-6 w-6" />
            </span>
            <h2 className="font-display text-2xl font-extrabold md:text-3xl">
              Carteira de Estudante Digital — UGE
            </h2>
            <p className="mt-3 max-w-xl text-hero-muted">
              Ao concluir sua matrícula por uma instituição parceira via Tô de Bolsa, você pode
              solicitar a carteira digital emitida pela UGE — União Geral dos Estudantes do Brasil,
              com direito a meia-entrada conforme a Lei nº 12.933/2013.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/bolsas">Buscar bolsas</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
              >
                <Link to="/carteira-uge">Saiba mais sobre a UGE</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Award, title: "Meia-entrada", text: "Cinema, shows, teatros e eventos culturais." },
              { icon: Sparkles, title: "100% digital", text: "Emissão online, sem burocracia." },
              { icon: BadgeCheck, title: "Validação pública", text: "QR Code verificável a qualquer momento." },
              { icon: IdCard, title: "Validade anual", text: "Renovada conforme o vínculo com a instituição." },
            ].map((i) => (
              <li key={i.title} className="rounded-xl border border-hero-foreground/15 bg-hero-foreground/10 p-4">
                <i.icon className="mb-2 h-5 w-5" />
                <div className="text-sm font-bold">{i.title}</div>
                <p className="mt-1 text-xs text-hero-muted">{i.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const { data } = useQuery({ queryKey: ["platform-stats"], queryFn: getPlatformStats });
  if (!data) return null;
  const stats: { value: string; label: string }[] = [];
  if (data.scholarships > 0)
    stats.push({ value: data.scholarships.toLocaleString("pt-BR"), label: data.scholarships === 1 ? "Bolsa ativa" : "Bolsas ativas" });
  if (data.institutions > 0)
    stats.push({ value: data.institutions.toLocaleString("pt-BR"), label: data.institutions === 1 ? "Instituição parceira" : "Instituições parceiras" });
  if (data.vacancies > 0)
    stats.push({ value: data.vacancies.toLocaleString("pt-BR"), label: "Vagas disponíveis" });
  if (data.maxDiscount > 0) stats.push({ value: `Até ${data.maxDiscount}%`, label: "De desconto" });
  if (stats.length === 0) return null;

  return (
    <section className="bg-card">
      <div className={`${SHELL} grid gap-6 border-y border-border py-10 sm:grid-cols-2 lg:grid-cols-4`}>
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaInstitution() {
  return (
    <section className={`${SHELL} py-10`}>
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center md:flex-row md:justify-between md:p-10 md:text-left">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-brand-ink">
            É uma instituição de ensino?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Publique suas bolsas, alcance estudantes de todo o Brasil e preencha as vagas ociosas
            das suas turmas — sem custo de adesão.
          </p>
        </div>
        <Button size="lg" asChild className="shrink-0">
          <Link to="/para-instituicoes">
            Quero ser parceira <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function FaqSection() {
  const { data } = useQuery({ queryKey: ["faqs"], queryFn: listFaqs });
  const faqs = (data ?? []).slice(0, 6);
  if (!faqs.length) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-center font-display text-2xl font-extrabold text-brand-ink md:text-[28px]">
        Perguntas frequentes
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f: { id: string; question: string; answer: string }) => (
          <AccordionItem key={f.id} value={f.id}>
            <AccordionTrigger className="text-left font-semibold">{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <Link to="/faq">Ver todas as perguntas</Link>
        </Button>
      </div>
    </section>
  );
}
