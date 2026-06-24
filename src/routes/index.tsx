import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, IdCard, ShieldCheck, Users, Award, Star } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchBar } from "@/components/site/SearchBar";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { listScholarships, listFeaturedInstitutions, listFaqs } from "@/lib/scholarships";
import heroImg from "@/assets/hero-students.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tô de Bolsa — Bolsas de estudo com até 90% de desconto" },
      { name: "description", content: "Encontre bolsas de estudo para escolas, faculdades, técnicos, idiomas e mais. Até 90% de desconto e carteira de estudante digital UGE." },
      { property: "og:title", content: "Tô de Bolsa — Até 90% de desconto em bolsas de estudo" },
      { property: "og:description", content: "Marketplace nacional de bolsas de estudo para todas as idades e níveis de ensino." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <CategorySection />
        <FeaturedSection />
        <InstitutionsSection />
        <BenefitsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-20 md:pb-16">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Bolsas para todas as idades
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Estude pagando menos com{" "}
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-discount)" }}
                >
                  até 90% de desconto
                </span>
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Encontre bolsas em escolas, faculdades, técnicos, idiomas, EJA, MBA e muito mais.
              Compare ofertas, reserve sua vaga e transforme sua vida com educação.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue-soft text-brand-blue px-3 py-1.5 font-semibold">
                <IdCard className="h-4 w-4" />
                Matriculou? Garante sua carteira UGE
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-foreground/80">
                <ShieldCheck className="h-4 w-4 text-success" />
                Instituições verificadas
              </span>
            </div>

            <div className="mt-10">
              <SearchBar />
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <Stat value="+500" label="bolsas ativas" />
              <Stat value="13" label="níveis de ensino" />
              <Stat value="90%" label="desconto máximo" />
            </dl>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2rem] -z-10 opacity-30 blur-2xl"
              style={{ backgroundImage: "var(--gradient-hero)" }}
              aria-hidden
            />
            <div className="relative rounded-3xl overflow-hidden border-8 border-card shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt="Estudantes brasileiros de diferentes idades e etnias sorrindo juntos"
                width={1536}
                height={1024}
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl bg-card shadow-[var(--shadow-card)] border border-border p-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-brand-blue-foreground">
                <IdCard className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Benefício exclusivo</div>
                <div className="text-sm font-bold">Carteira UGE digital</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] p-4">
              <div className="text-xs opacity-90">Até</div>
              <div className="text-3xl font-extrabold leading-none">90%</div>
              <div className="text-xs opacity-90">OFF</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-extrabold text-primary">{value}</dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
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
          Escolha sua categoria e descubra bolsas em todos os níveis de ensino.
        </p>
      </div>
      <CategoryGrid />
    </section>
  );
}

function FeaturedSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "featured"],
    queryFn: () => listScholarships({ featuredOnly: true, limit: 6 }),
  });

  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <Star className="h-3.5 w-3.5 fill-primary" />
              Em destaque
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Bolsas selecionadas para você
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/bolsas">
              Ver todas as bolsas <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data?.map((s) => <ScholarshipCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function InstitutionsSection() {
  const { data } = useQuery({
    queryKey: ["institutions", "featured"],
    queryFn: listFeaturedInstitutions,
  });

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold">
          Instituições parceiras
        </h2>
        <p className="mt-3 text-muted-foreground">
          Escolas, faculdades e centros de ensino credenciados em todo o Brasil.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.map((i) => (
          <Link
            key={i.id}
            to="/instituicoes/$slug"
            params={{ slug: i.slug }}
            className="group rounded-2xl border border-border bg-card p-6 hover:border-brand-blue hover:bg-brand-blue-soft/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-soft text-brand-blue font-bold">
                {i.trade_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="font-bold truncate">{i.trade_name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {i.rating?.toFixed(1) ?? "—"}
                </div>
              </div>
            </div>
            {i.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{i.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  const items = [
    { icon: IdCard, title: "Carteira de estudante UGE", text: "Após a matrícula confirmada, você garante sua carteira digital emitida pela União Geral dos Estudantes do Brasil." },
    { icon: ShieldCheck, title: "Instituições verificadas", text: "Trabalhamos com escolas e faculdades credenciadas. Aprovamos cada parceiro antes de publicar bolsas." },
    { icon: Award, title: "Até 90% de desconto", text: "Bolsas reais com descontos imperdíveis em mensalidade, em todos os níveis de ensino." },
    { icon: Users, title: "Para todas as idades", text: "Do ensino fundamental ao mestrado. Bolsas para crianças, jovens, adultos e idosos." },
  ];
  return (
    <section className="bg-gradient-to-b from-secondary/40 to-background py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">
            Por que usar o Tô de Bolsa?
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <div key={b.title} className="rounded-2xl bg-card border border-border p-6">
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

function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid md:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-8 md:p-10 text-primary-foreground relative overflow-hidden"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-3">
            Pronto para sua bolsa?
          </h3>
          <p className="opacity-90 mb-6 max-w-md">
            Compare ofertas em segundos e garanta sua vaga com desconto.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/bolsas">Buscar bolsas</Link>
          </Button>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
          <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-3">
            Sua instituição quer crescer?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Cadastre seus cursos, bolsas e campanhas. Receba alunos qualificados.
          </p>
          <Button size="lg" asChild>
            <Link to="/para-instituicoes">Cadastrar instituição</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
