import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CheckCircle2, BarChart3, Users, Megaphone, Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

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

const leadSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  course_interest: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
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
              Venda mais matrículas preenchendo <span className="text-primary">vagas ociosas</span> com bolsas inteligentes
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre cursos, defina suas bolsas, controle vagas e receba alunos qualificados — tudo de forma
              self-service no maior marketplace de bolsas do Brasil.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <a href="#credenciamento">Solicitar credenciamento</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/instituicao/cadastrar">Já tenho conta — cadastrar agora</Link>
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
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: 1, t: "Credenciamento", d: "Envie os dados da sua instituição. Aprovação em até 48h." },
                { n: 2, t: "Cadastro de cursos", d: "Adicione cursos, unidades, turnos e vagas disponíveis." },
                { n: 3, t: "Publicação de bolsas", d: "Defina percentuais, regras e prazos para cada bolsa." },
                { n: 4, t: "Recebimento de alunos", d: "Receba reservas, confirme matrículas e fature." },
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
          </div>
        </section>

        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}

function LeadForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    course_interest: "",
    notes: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      city: parsed.data.city,
      course_interest: parsed.data.course_interest || null,
      notes: parsed.data.notes || null,
      source: "para-instituicoes",
      status: "NEW",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente em instantes.");
      return;
    }
    setDone(true);
    toast.success("Recebemos seu pedido! Nossa equipe entra em contato em até 48h.");
  }

  return (
    <section id="credenciamento" className="py-16 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Solicite o credenciamento
            </h2>
            <p className="mt-3 text-muted-foreground">
              Preencha o formulário e nosso time comercial entra em contato em até 48 horas úteis.
            </p>
          </div>

          {done ? (
            <div className="text-center py-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2">Pedido recebido!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Em breve um consultor entrará em contato pelo telefone <strong>{form.phone}</strong> ou pelo e-mail <strong>{form.email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
              <Field label="Nome do responsável *" htmlFor="lead-name">
                <Input id="lead-name" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={120} />
              </Field>
              <Field label="E-mail corporativo *" htmlFor="lead-email">
                <Input id="lead-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required maxLength={160} />
              </Field>
              <Field label="Telefone / WhatsApp *" htmlFor="lead-phone">
                <Input id="lead-phone" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={30} placeholder="(11) 99999-9999" />
              </Field>
              <Field label="Cidade / UF *" htmlFor="lead-city">
                <Input id="lead-city" value={form.city} onChange={(e) => update("city", e.target.value)} required maxLength={120} placeholder="São Paulo / SP" />
              </Field>
              <Field label="Nome da instituição" htmlFor="lead-course" className="md:col-span-2">
                <Input id="lead-course" value={form.course_interest} onChange={(e) => update("course_interest", e.target.value)} maxLength={200} placeholder="Ex.: Faculdade Modelo" />
              </Field>
              <Field label="Conte um pouco mais (opcional)" htmlFor="lead-notes" className="md:col-span-2">
                <Textarea id="lead-notes" rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} maxLength={1000} placeholder="Quantos cursos? Modalidades (EAD, presencial)? Volume estimado de vagas?" />
              </Field>
              <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  Ao enviar, você concorda com nossos <Link to="/termos" className="underline">Termos</Link> e <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
                </p>
                <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : "Solicitar credenciamento"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
