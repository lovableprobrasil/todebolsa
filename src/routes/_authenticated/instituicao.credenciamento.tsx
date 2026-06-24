import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Clock, CheckCircle2, AlertCircle, MessageSquare, Send, Edit3, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/instituicao/credenciamento")({
  component: CredenciamentoPage,
});

const STATUS_META: Record<string, { label: string; tone: string; help: string }> = {
  DRAFT:        { label: "Rascunho",       tone: "bg-muted text-foreground",               help: "Finalize o cadastro para enviarmos para análise." },
  SUBMITTED:    { label: "Enviado",        tone: "bg-brand-blue-soft text-brand-blue",     help: "Recebido! Em breve nossa equipe iniciará a análise." },
  UNDER_REVIEW: { label: "Em análise",     tone: "bg-warning/15 text-warning-foreground",  help: "Nossa equipe está revisando seus dados." },
  NEEDS_INFO:   { label: "Pendência",      tone: "bg-warning/15 text-warning-foreground",  help: "Precisamos de mais informações — edite e reenvie." },
  APPROVED:     { label: "Aprovado",       tone: "bg-primary-soft text-primary",           help: "Tudo certo! Seu painel completo já está liberado." },
  REJECTED:     { label: "Recusado",       tone: "bg-destructive/15 text-destructive",     help: "O cadastro foi recusado. Veja o motivo abaixo." },
  SUSPENDED:    { label: "Suspenso",       tone: "bg-destructive/15 text-destructive",     help: "Seu credenciamento foi suspenso." },
};

function CredenciamentoPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, refreshRoles } = useAuth();

  const { data: app, isLoading } = useQuery({
    queryKey: ["my-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (app?.status === "APPROVED") {
      refreshRoles();
      if (app.institution_id) navigate({ to: "/instituicao/$id", params: { id: app.institution_id } });
    }
  }, [app?.status, app?.institution_id]); // eslint-disable-line

  const { data: messages } = useQuery({
    queryKey: ["app-messages", app?.id],
    enabled: !!app?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_application_messages")
        .select("*")
        .eq("application_id", app!.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const [msg, setMsg] = useState("");
  const postMut = useMutation({
    mutationFn: async () => {
      if (!app?.id || !msg.trim()) return;
      const { error } = await supabase.rpc("post_application_message", { p_id: app.id, p_message: msg.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg("");
      qc.invalidateQueries({ queryKey: ["app-messages", app?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />;

  if (!app) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center max-w-2xl">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
          <Building2 className="h-7 w-7" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Você ainda não iniciou um credenciamento</h2>
        <p className="text-muted-foreground mb-5">Cadastre sua instituição para acessar o pré-painel.</p>
        <Button asChild><Link to="/instituicao/cadastrar">Cadastrar instituição</Link></Button>
      </div>
    );
  }

  const meta = STATUS_META[app.status] ?? STATUS_META.DRAFT;
  const canEdit = app.status === "DRAFT" || app.status === "NEEDS_INFO";
  const checklist = buildChecklist(app);

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {app.trade_name || "Sua instituição"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Credenciamento — pré-painel</p>
          </div>
          <Badge className={meta.tone + " border-0 text-sm h-7 px-3"}>
            {app.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 mr-1" /> :
             app.status === "REJECTED" || app.status === "SUSPENDED" ? <AlertCircle className="h-4 w-4 mr-1" /> :
             <Clock className="h-4 w-4 mr-1" />}
            {meta.label}
          </Badge>
        </div>
        <p className="mt-4 text-sm text-foreground/80">{meta.help}</p>
        {app.rejection_reason && (
          <div className="mt-4 rounded-xl bg-destructive/10 text-destructive p-3 text-sm">
            <strong>Motivo:</strong> {app.rejection_reason}
          </div>
        )}
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold mb-3">Checklist</h2>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                {c.done
                  ? <CheckCircle2 className="h-4 w-4 text-primary" />
                  : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />}
                <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold mb-3">Próximos passos</h2>
          <div className="space-y-2">
            {canEdit && (
              <Button asChild className="w-full justify-start">
                <Link to="/instituicao/cadastrar"><Edit3 className="h-4 w-4 mr-2" /> Editar cadastro</Link>
              </Button>
            )}
            <Button variant="outline" asChild className="w-full justify-start">
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4 mr-2" /> Falar com consultor
              </a>
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-bold mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Mensagens com a equipe
        </h2>
        <div className="space-y-2 max-h-80 overflow-auto mb-3">
          {messages && messages.length > 0 ? messages.map((m) => (
            <div key={m.id} className={"rounded-xl p-3 text-sm " + (m.author_role === "ADMIN" ? "bg-brand-blue-soft/40" : "bg-secondary")}>
              <div className="text-[10px] font-bold uppercase mb-1 text-muted-foreground">
                {m.author_role === "ADMIN" ? "Tô de Bolsa" : "Você"} · {new Date(m.created_at).toLocaleString("pt-BR")}
              </div>
              <div className="whitespace-pre-wrap">{m.message}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
        </div>
        <div className="flex gap-2">
          <Textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva uma mensagem para a equipe..." />
          <Button onClick={() => postMut.mutate()} disabled={!msg.trim() || postMut.isPending}>
            {postMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </section>
    </div>
  );
}

function buildChecklist(app: any) {
  return [
    { label: "Dados da instituição", done: !!app.trade_name && !!app.cnpj && !!app.institution_type },
    { label: "Dados do responsável", done: !!app.responsible_name && !!app.responsible_email },
    { label: "Endereço completo", done: !!app.zip && !!app.city && !!app.state },
    { label: "Oferta educacional", done: (app.courses_offered?.length ?? 0) > 0 && (app.levels?.length ?? 0) > 0 },
    { label: "Termos aceitos", done: app.accepted_terms && app.accepted_privacy && app.accepted_truthfulness && app.accepted_representation },
    { label: "Cadastro enviado", done: app.status !== "DRAFT" },
  ];
}
