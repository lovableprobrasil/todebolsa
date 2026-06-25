import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error } = await supabase.from("leads").insert({
        email,
        name: name || null,
        source: "newsletter_news",
        status: "NEW",
      } as never);
      if (error) throw error;
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Não foi possível inscrever.");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary-soft/30 p-6 text-center">
        <Check className="h-8 w-8 mx-auto text-primary mb-2" />
        <h3 className="font-display font-bold text-lg">Inscrição confirmada!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Você receberá nossos próximos artigos diretamente no e-mail.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="flex items-center gap-2 text-primary mb-2">
        <Mail className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wide">Newsletter</span>
      </div>
      <h3 className="font-display text-xl md:text-2xl font-extrabold">
        Receba novidades sobre bolsas
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Dicas semanais sobre ENEM, FIES, ProUni e oportunidades de bolsa direto no seu e-mail.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome (opcional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Quero receber
      </button>
      {status === "error" && (
        <p className="text-xs text-destructive mt-2">{errorMsg}</p>
      )}
      <p className="text-[11px] text-muted-foreground mt-3">
        Ao inscrever-se, você concorda com nossa{" "}
        <a href="/cookies" className="underline hover:text-primary">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
