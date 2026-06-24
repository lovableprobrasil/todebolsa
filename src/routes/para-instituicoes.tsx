import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, BarChart3, Users, Megaphone } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/para-instituicoes")({
  head: () => ({
    meta: [
      { title: "Para instituições | Tô de Bolsa" },
      { name: "description", content: "Cadastre sua instituição no Tô de Bolsa e alcance milhares de alunos em todo o Brasil." },
      { property: "og:title", content: "Cadastre sua instituição no Tô de Bolsa" },
      { property: "og:description", content: "Cursos, polos, vagas, bolsas e campanhas. Tudo em um só painel." },
      { property: "og:url", content: "https://todebolsa.lovable.app/para-instituicoes" },
      { name: "twitter:title", content: "Cadastre sua instituição no Tô de Bolsa" },
      { name: "twitter:description", content: "Cursos, polos, vagas, bolsas e campanhas. Tudo em um só painel." },
    ],
    links: [{ rel: "canonical", href: "https://todebolsa.lovable.app/para-instituicoes" }],
  }),
  component: ForInstitutionsPage,
});

function ForInstitutionsPage() {
  const benefits = [
    { icon: Users, title: "Alunos qualificados", text: "Receba leads de alunos buscando exatamente o que você oferece." },
    { icon: BarChart3, title: "Painel completo", text: "Gerencie cursos, unidades, vagas, bolsas e campanhas em um só lugar." },
    { icon: Megaphone, title: "Campanhas promocionais", text: "Crie campanhas de até 90% de desconto e gere demanda instantânea." },
    { icon: CheckCircle2, title: "Credenciamento simples", text: "Cadastro guiado e aprovação rápida da nossa equipe." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-soft/60 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-soft text-brand-blue px-3 py-1 text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" /> Portal da instituição
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto">
              Sua instituição no maior marketplace de bolsas do Brasil
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre cursos, defina suas bolsas, controle vagas e receba alunos qualificados —
              tudo de forma self-service.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/instituicao/cadastrar">Solicitar credenciamento</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/bolsas">Ver como funciona para alunos</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
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

        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-10">
              Como funciona
            </h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {[
                { n: 1, t: "Solicite cadastro", d: "Envie os dados da sua instituição em poucos minutos." },
                { n: 2, t: "Cadastre cursos", d: "Adicione cursos, unidades, vagas e bolsas." },
                { n: 3, t: "Receba alunos", d: "Alunos descobrem sua bolsa, reservam e se matriculam." },
              ].map((s) => (
                <li key={s.n} className="rounded-2xl bg-card border border-border p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold mb-3">
                    {s.n}
                  </div>
                  <h3 className="font-bold mb-1">{s.t}</h3>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <Button size="lg" asChild>
                <Link to="/instituicao/cadastrar">Quero cadastrar minha instituição</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
