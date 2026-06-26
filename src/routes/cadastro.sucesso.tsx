import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Mail, Clock } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cadastro/sucesso")({
  head: () => ({
    meta: [
      { title: "Cadastro recebido | Tô de Bolsa" },
      { name: "description", content: "Sua instituição foi cadastrada com sucesso. Em até 2 dias úteis nossa equipe entrará em contato." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Parabéns! Sua instituição foi cadastrada.
            </h1>

            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Agradecemos o seu interesse em ser nosso parceiro. Seu cadastro foi
              recebido e agora passará por um processo de análise interna.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Até 2 dias úteis</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Prazo de análise da nossa equipe.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">E-mail enviado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confirmação no e-mail do responsável.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Entraremos em contato para informar sobre a aprovação ou solicitar
              informações adicionais, caso necessário.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/instituicao/credenciamento">
                  Acompanhar credenciamento <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Voltar à página inicial</Link>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Não recebeu o e-mail? Verifique a caixa de spam ou fale com a gente em{" "}
            <a href="mailto:contato@todebolsa.com.br" className="underline">
              contato@todebolsa.com.br
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
