import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CheckCircle2, BarChart3, Users, Megaphone, ArrowRight, MessageCircle, ClipboardList, BookOpen, Sparkles, ChevronDown } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/para-instituicoes")({
  head: () => ({
    meta: [
      { title: "Cadastre sua instituição | Tô de Bolsa" },
      { name: "description", content: "Transforme vagas ociosas em matrículas com bolsas inteligentes. Cadastre sua instituição no Tô de Bolsa e receba alunos qualificados." },
      { property: "og:title", content: "Transforme vagas ociosas em matrículas — Tô de Bolsa" },
      { property: "og:description", content: "Cadastre sua instituição, publique bolsas, controle vagas e receba alunos prontos para matricular." },
      { property: "og:url", content: "https://todebolsa.lovable.app/para-instituicoes" },
      { name: "twitter:title", content: "Transforme vagas ociosas em matrículas" },
      { name: "twitter:description", content: "Cadastre sua instituição no Tô de Bolsa e venda mais matrículas." },
    ],
    links: [{ rel: "canonical", href: "https://todebolsa.lovable.app/para-instituicoes" }],
  }),
  component: ForInstitutionsPage,
});

const BENEFITS = [
  { icon: BarChart3, title: "Preencha vagas ociosas", text: "Transforme turmas com vagas livres em matrículas reais." },
  { icon: Users, title: "Alunos qualificados", text: "Receba estudantes interessados em estudar agora." },
  { icon: Megaphone, title: "Controle de campanhas", text: "Crie bolsas, defina descontos, prazos e regras." },
  { icon: Building2, title: "Divulgação por cidade e modalidade", text: "Seu curso aparece para quem busca exatamente isso." },
  { icon: ClipboardList, title: "Reservas e matrículas", text: "Acompanhe o funil completo em um único painel." },
  { icon: Sparkles, title: "Sem mensalidade", text: "Você só remunera o Tô de Bolsa quando o aluno reserva." },
];

const STEPS = [
  { n: 1, t: "Cadastre sua instituição", d: "Preencha o formulário em 5 etapas com os dados, responsável e oferta." },
  { n: 2, t: "Aguarde análise", d: "Nossa equipe revisa os dados em até 48h úteis." },
  { n: 3, t: "Acesse o painel", d: "Aprovado, você ganha o painel completo da instituição." },
  { n: 4, t: "Cadastre cursos e bolsas", d: "Adicione unidades, cursos, vagas, percentuais e regras." },
  { n: 5, t: "Receba alunos", d: "Reservas, pagamento e matrícula acompanhados em tempo real." },
];

const QUEM = [
  "Escolas de educação básica",
  "Faculdades e centros universitários",
  "Cursos técnicos e profissionalizantes",
  "Escolas de idiomas",
  "EJA, pós-graduação e MBA",
  "Cursos livres e treinamentos corporativos",
];

const FAQ = [
  { q: "Quanto custa para cadastrar minha instituição?", a: "O cadastro é gratuito. O Tô de Bolsa só é remunerado a cada reserva confirmada." },
  { q: "Quanto tempo demora a aprovação?", a: "Em geral até 48h úteis após o envio do credenciamento." },
  { q: "Posso editar os dados depois?", a: "Sim. O responsável da instituição tem acesso ao painel para editar dados, cursos, bolsas, unidades e campanhas a qualquer momento." },
  { q: "Quais documentos preciso enviar?", a: "Inicialmente apenas os dados cadastrais. Caso a equipe peça documentos complementares, você poderá enviá-los pelo pré-painel." },
  { q: "Quem pode representar a instituição?", a: "Apenas pessoas com autorização formal (diretor, mantenedor ou representante legal). Isso é declarado no cadastro." },
  { q: "Posso suspender minha participação?", a: "Sim. A qualquer momento você pode pausar a publicação das suas bolsas pelo painel." },
];

function ForInstitutionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-soft/60 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-soft text-brand-blue px-3 py-1 text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" /> Portal da instituição
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
              Transforme <span className="text-primary">vagas ociosas</span> em matrículas com bolsas inteligentes
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre sua instituição no Tô de Bolsa, publique cursos com desconto, controle vagas e
              receba alunos interessados em estudar agora.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to="/instituicao/cadastrar">
                  Cadastrar instituição para análise <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Falar com consultor
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-10">
            Por que estar no Tô de Bolsa?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue-soft text-brand-blue mb-4">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="font-bold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-10">
              Como funciona em 5 etapas
            </h2>
            <ol className="grid gap-4 md:grid-cols-5">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl bg-card border border-border p-5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold mb-3">
                    {s.n}
                  </div>
                  <h3 className="font-bold mb-1 text-sm">{s.t}</h3>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Quem pode */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-8 flex items-center justify-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" /> Quem pode participar
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {QUEM.map((q) => (
              <li key={q} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-8">
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Pronto para preencher suas vagas?
            </h2>
            <p className="mt-3 text-muted-foreground">
              O cadastro leva poucos minutos. A análise é feita pela nossa equipe e seu painel é
              liberado assim que aprovado.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to="/instituicao/cadastrar">
                  Cadastrar instituição para análise <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  Falar com consultor
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="font-semibold">{q}</span>
        <ChevronDown className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}
