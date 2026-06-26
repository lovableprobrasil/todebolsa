import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Cancelar inscrição | Tô de Bolsa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "valid"; email?: string }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setState({ kind: "invalid" });
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data?.valid) setState({ kind: "valid", email: data.email });
        else if (data?.alreadyUnsubscribed) setState({ kind: "already" });
        else setState({ kind: "invalid" });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, []);

  async function confirm() {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) setState({ kind: "success" });
      else setState({ kind: "error", message: "Não foi possível concluir." });
    } catch {
      setState({ kind: "error", message: "Erro de rede. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            {state.kind === "loading" && (
              <>
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Validando link...</p>
              </>
            )}
            {state.kind === "valid" && (
              <>
                <h1 className="font-display text-2xl font-extrabold mb-2">Cancelar inscrição</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Deseja parar de receber e-mails {state.email ? `em ${state.email}` : ""}?
                </p>
                <Button onClick={confirm} disabled={submitting} size="lg">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmar cancelamento
                </Button>
              </>
            )}
            {state.kind === "already" && (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <h1 className="mt-4 font-display text-xl font-extrabold">Você já cancelou</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Este e-mail já está fora da nossa lista.
                </p>
              </>
            )}
            {state.kind === "invalid" && (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h1 className="mt-4 font-display text-xl font-extrabold">Link inválido</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Este link expirou ou não é válido.
                </p>
              </>
            )}
            {state.kind === "success" && (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <h1 className="mt-4 font-display text-xl font-extrabold">Cancelamento concluído</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você não receberá mais e-mails. Sentiremos sua falta!
                </p>
              </>
            )}
            {state.kind === "error" && (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h1 className="mt-4 font-display text-xl font-extrabold">Algo deu errado</h1>
                <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
