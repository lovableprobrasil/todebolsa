import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Pause, Star, Send, Loader2, MessageSquare, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/credenciamento-instituicoes/$id")({
  component: AdminApplicationDetail,
});

function AdminApplicationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const { data: app, isLoading } = useQuery({
    queryKey: ["admin-app", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_applications").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-app-messages", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_application_messages")
        .select("*").eq("application_id", id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_INFO" | "REJECTED" | "SUSPENDED" | "APPROVED" | "DRAFT") => {
      const { error } = await supabase.rpc("set_application_status", {
        p_id: id, p_status: status, p_message: reason || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Status atualizado.");
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("approve_institution_application", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Credenciamento aprovado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePotential = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("toggle_application_high_potential", {
        p_id: id, p_flag: !app?.high_potential,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-app", id] }),
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("set_application_internal_notes", { p_id: id, p_notes: notes });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-app", id] }); toast.success("Anotação salva."); },
  });

  const postMsg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("post_application_message", { p_id: id, p_message: msg });
      if (error) throw error;
    },
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["admin-app-messages", id] }); },
  });

  if (isLoading || !app) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ to: "/admin/credenciamento-instituicoes" })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <header className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">{app.trade_name ?? "(sem nome)"}</h1>
            <div className="text-sm text-muted-foreground mt-1">
              CNPJ {app.cnpj ?? "—"} · {app.city ?? "—"}/{app.state ?? "—"} · Resp.: {app.responsible_name ?? "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {app.high_potential && <Badge className="bg-accent/20 text-accent-foreground border-0"><Star className="h-3 w-3 mr-1 fill-current" /> Alto potencial</Badge>}
            <Badge className="border-0">{app.status}</Badge>
          </div>
        </div>
      </header>

      <Tabs defaultValue="dados">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dados">Dados gerais</TabsTrigger>
          <TabsTrigger value="responsavel">Responsável</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="oferta">Cursos e ofertas</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="comercial">Análise comercial</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="decisao">Decisão</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <Info label="Nome fantasia" value={app.trade_name} />
          <Info label="Razão social" value={app.legal_name} />
          <Info label="CNPJ" value={app.cnpj} />
          <Info label="Tipo" value={app.institution_type} />
          <Info label="Site" value={app.website} />
          <Info label="Instagram" value={app.instagram} />
          <Info label="Telefone" value={app.phone} />
          <Info label="E-mail" value={app.email} />
        </TabsContent>

        <TabsContent value="responsavel" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <Info label="Nome" value={app.responsible_name} />
          <Info label="Cargo" value={app.responsible_role} />
          <Info label="CPF" value={app.responsible_cpf} />
          <Info label="E-mail" value={app.responsible_email} />
          <Info label="WhatsApp" value={app.responsible_whatsapp} />
          <Info label="Autorização declarada" value={app.authorization_declared ? "Sim" : "Não"} />
        </TabsContent>

        <TabsContent value="endereco" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <Info label="CEP" value={app.zip} />
          <Info label="Endereço" value={`${app.address ?? ""}, ${app.number ?? ""} ${app.complement ?? ""}`} />
          <Info label="Bairro" value={app.neighborhood} />
          <Info label="Cidade/UF" value={`${app.city ?? ""}/${app.state ?? ""}`} />
          <Info label="Modalidade" value={app.service_mode} />
        </TabsContent>

        <TabsContent value="oferta" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <Info label="Cursos oferecidos" value={(app.courses_offered ?? []).join(", ")} />
          <Info label="Níveis" value={(app.levels ?? []).join(", ")} />
          <Info label="Modalidades" value={(app.modalities ?? []).join(", ")} />
          <Info label="Vagas ociosas" value={app.has_idle_vacancies === null ? "—" : app.has_idle_vacancies ? "Sim" : "Não"} />
          <Info label="Desconto médio pretendido" value={app.avg_discount_pct ? app.avg_discount_pct + "%" : "—"} />
          <Info label="Vagas estimadas/mês" value={app.monthly_vacancies?.toString()} />
        </TabsContent>

        <TabsContent value="docs" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <DocsList appId={id} />
        </TabsContent>

        <TabsContent value="comercial" className="rounded-2xl border border-border bg-card p-6 mt-4 space-y-4">
          <Button variant="outline" onClick={() => togglePotential.mutate()}>
            <Star className={"h-4 w-4 mr-1 " + (app.high_potential ? "fill-accent text-accent" : "")} />
            {app.high_potential ? "Remover alto potencial" : "Marcar como alto potencial"}
          </Button>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Observações internas</label>
            <Textarea rows={4} defaultValue={app.internal_notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" onClick={() => saveNotes.mutate()}>Salvar anotação</Button>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="rounded-2xl border border-border bg-card p-6 mt-4">
          <div className="space-y-2 max-h-96 overflow-auto mb-3">
            {messages && messages.length > 0 ? messages.map((m) => (
              <div key={m.id} className={"rounded-xl p-3 text-sm " + (m.author_role === "ADMIN" ? "bg-brand-blue-soft/40" : "bg-secondary")}>
                <div className="text-[10px] font-bold uppercase mb-1 text-muted-foreground">
                  {m.author_role === "ADMIN" ? "Equipe" : "Candidato"} · {new Date(m.created_at).toLocaleString("pt-BR")}
                </div>
                <div className="whitespace-pre-wrap">{m.message}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sem mensagens.</p>}
          </div>
          <div className="flex gap-2">
            <Textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva uma mensagem ao candidato..." />
            <Button onClick={() => postMsg.mutate()} disabled={!msg.trim() || postMsg.isPending}>
              {postMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="decisao" className="rounded-2xl border border-border bg-card p-6 mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Mensagem/Motivo (opcional)</label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Será enviado ao candidato como notificação/mensagem." />
          </div>
          <div className="flex flex-wrap gap-2">
            {app.status !== "APPROVED" && (
              <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar credenciamento
              </Button>
            )}
            <Button variant="outline" onClick={() => setStatus.mutate("UNDER_REVIEW")}>
              <AlertCircle className="h-4 w-4 mr-1" /> Marcar em análise
            </Button>
            <Button variant="outline" onClick={() => setStatus.mutate("NEEDS_INFO")}>
              Solicitar informações
            </Button>
            <Button variant="outline" onClick={() => setStatus.mutate("REJECTED")}>
              <XCircle className="h-4 w-4 mr-1" /> Recusar
            </Button>
            <Button variant="outline" onClick={() => setStatus.mutate("SUSPENDED")}>
              <Pause className="h-4 w-4 mr-1" /> Suspender
            </Button>
          </div>
          {app.status === "APPROVED" && app.institution_id && (
            <div className="rounded-xl bg-primary-soft p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-primary" />
              Aprovado. <Link to="/instituicao/$id" params={{ id: app.institution_id }} className="underline font-bold">Ver instituição</Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2 border-b border-border last:border-0 grid grid-cols-3 gap-3 text-sm">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );
}

function DocsList({ appId }: { appId: string }) {
  const { data } = useQuery({
    queryKey: ["admin-app-docs", appId],
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_application_documents")
        .select("*").eq("application_id", appId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>;
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.id} className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{d.doc_type}</span>
          <span className="text-muted-foreground">{d.file_name}</span>
        </li>
      ))}
    </ul>
  );
}
