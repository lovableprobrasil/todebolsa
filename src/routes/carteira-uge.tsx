import { createFileRoute, Link } from "@tanstack/react-router";
import { IdCard, ShieldCheck, Clock, Calendar, CheckCircle2, FileCheck2, Ticket, GraduationCap, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TITLE = "Carteira de Estudante Digital UGE | Tô de Bolsa";
const DESC = "Conheça a Carteira Estudantil Digital emitida pela UGE — União Geral dos Estudantes do Brasil. Meia-entrada em cinemas, shows, teatros e eventos esportivos.";
const URL = "https://todebolsa.lovable.app/carteira-uge";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Quem pode receber a carteira UGE?",
    a: "Alunos matriculados em cursos elegíveis através do Tô de Bolsa, após a confirmação da matrícula pela instituição parceira.",
  },
  {
    q: "Quanto tempo leva para receber?",
    a: "A versão digital é emitida em até 7 dias úteis após a confirmação da matrícula. A versão física, quando aplicável, pode levar mais alguns dias.",
  },
  {
    q: "A carteira é aceita em todo o Brasil?",
    a: "Sim. A Carteira Estudantil Digital UGE garante meia-entrada conforme a Lei Federal nº 12.933/2013 em estabelecimentos parceiros em todo o país.",
  },
  {
    q: "Qual a validade da carteira?",
    a: "A validade é até 31 de março do ano seguinte ao da emissão, conforme legislação vigente. A renovação acompanha a renovação da matrícula.",
  },
  {
    q: "Quanto custa?",
    a: "A emissão é gratuita para alunos matriculados em cursos elegíveis no Tô de Bolsa — está incluída no benefício.",
  },
];

export const Route = createFileRoute("/carteira-uge")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Carteira Estudantil Digital UGE",
          provider: { "@type": "Organization", name: "UGE — União Geral dos Estudantes do Brasil" },
          areaServed: "BR",
          description: DESC,
          url: URL,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: "https://todebolsa.lovable.app/" },
            { "@type": "ListItem", position: 2, name: "Carteira UGE", item: URL },
          ],
        }),
      },
    ],
  }),
  component: CarteiraUgePage,
});

function CarteiraUgePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-hero text-hero-foreground">
          <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 text-accent px-3 py-1 text-xs font-bold mb-5">
                  <IdCard className="h-3.5 w-3.5" />
                  Benefício oficial para alunos matriculados
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.04] tracking-tight">
                  Carteira de Estudante <span className="text-accent">Digital UGE</span>
                </h1>
                <p className="mt-5 text-lg text-hero-muted max-w-xl">
                  Garantia de meia-entrada em cinemas, shows, teatros e eventos esportivos em todo o Brasil — emitida pela
                  <strong className="text-hero-foreground"> UGE — União Geral dos Estudantes do Brasil</strong> para alunos matriculados em cursos elegíveis no Tô de Bolsa.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" className="rounded-xl h-12 px-6 text-base" asChild>
                    <Link to="/bolsas">
                      Quero minha bolsa <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl h-12 px-6 text-base bg-transparent border-white/25 text-hero-foreground hover:bg-white/10 hover:text-hero-foreground"
                    asChild
                  >
                    <a href="#faq">Tirar dúvidas</a>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div aria-hidden className="absolute inset-0 rounded-[2rem] bg-accent/15 blur-2xl" />
                <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-hero-muted">Carteira Digital</div>
                      <div className="font-display text-xl font-extrabold">UGE</div>
                    </div>
                    <IdCard className="h-8 w-8 text-accent" />
                  </div>
                  <div className="grid h-32 w-full place-items-center rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 text-hero-foreground/80 text-xs">
                    Foto do estudante
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="text-sm font-bold">Nome do estudante</div>
                    <div className="text-xs text-hero-muted">Instituição parceira · Curso elegível</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-white/[0.06] px-3 py-2">
                      <div className="text-hero-muted">Validade</div>
                      <div className="font-bold">31/03 ano seguinte</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.06] px-3 py-2">
                      <div className="text-hero-muted">Emissão</div>
                      <div className="font-bold">Digital</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards de informação */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Como funciona a Carteira UGE
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tudo o que você precisa saber para garantir o seu benefício.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={IdCard} title="O que é">
              Documento estudantil digital emitido pela UGE, com validade nacional para meia-entrada em eventos
              culturais e esportivos.
            </InfoCard>
            <InfoCard icon={GraduationCap} title="Quem pode receber">
              Alunos matriculados em cursos elegíveis ofertados por instituições parceiras do Tô de Bolsa,
              após a confirmação da matrícula.
            </InfoCard>
            <InfoCard icon={FileCheck2} title="Como é emitida">
              Após sua matrícula ser confirmada, você recebe um e-mail com as instruções de acesso à versão digital.
            </InfoCard>
            <InfoCard icon={Clock} title="Prazo de emissão">
              Até <strong>7 dias úteis</strong> após a confirmação da matrícula pela instituição.
            </InfoCard>
            <InfoCard icon={Calendar} title="Validade">
              Até <strong>31 de março</strong> do ano seguinte ao da emissão, conforme legislação vigente.
            </InfoCard>
            <InfoCard icon={Ticket} title="Benefícios">
              Meia-entrada em cinemas, shows, teatros, eventos esportivos e culturais em todo o território nacional.
            </InfoCard>
          </div>
        </section>

        {/* Documentos */}
        <section className="bg-secondary/40 py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">Documentos necessários</h2>
              <p className="mt-3 text-muted-foreground">
                Tenha em mãos para acelerar a emissão da sua carteira.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Documento oficial com foto (RG, CNH ou passaporte)",
                  "CPF",
                  "Foto 3x4 recente em fundo branco",
                  "Comprovante de matrícula da instituição",
                  "E-mail e telefone para contato",
                ].map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-brand-blue-soft/60 text-brand-blue p-4 text-sm">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Seus dados são tratados em conformidade com a LGPD e usados exclusivamente para emissão e validação
                  da carteira estudantil.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">Perguntas frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 md:p-10 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold">
              Comece pela sua bolsa de estudo
            </h2>
            <p className="mt-2 opacity-90 max-w-xl mx-auto">
              Encontre o curso ideal com até 90% de desconto e garanta automaticamente sua Carteira UGE.
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link to="/bolsas">
                Buscar bolsas agora <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InfoCard({
  icon: Icon, title, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary mb-4">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
