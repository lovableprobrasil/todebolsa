import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Search, Star, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/credenciamento-instituicoes")({
  component: AdminApplicationsList,
});

const STATUS_FILTERS = [
  { v: "ALL", l: "Todos" },
  { v: "SUBMITTED", l: "Enviados" },
  { v: "UNDER_REVIEW", l: "Em análise" },
  { v: "NEEDS_INFO", l: "Pendência" },
  { v: "APPROVED", l: "Aprovados" },
  { v: "REJECTED", l: "Recusados" },
  { v: "SUSPENDED", l: "Suspensos" },
  { v: "HIGH_POTENTIAL", l: "Alto potencial" },
  { v: "DUPLICATE", l: "CNPJ duplicado" },
];

const TONES: Record<string, string> = {
  DRAFT: "bg-muted text-foreground",
  SUBMITTED: "bg-brand-blue-soft text-brand-blue",
  UNDER_REVIEW: "bg-warning/15 text-warning-foreground",
  NEEDS_INFO: "bg-warning/15 text-warning-foreground",
  APPROVED: "bg-primary-soft text-primary",
  REJECTED: "bg-destructive/15 text-destructive",
  SUSPENDED: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviado",
  UNDER_REVIEW: "Em análise",
  NEEDS_INFO: "Pendência",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  SUSPENDED: "Suspenso",
};

function AdminApplicationsList() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-applications", "rpc"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_institution_applications");
      if (error) throw error;
      return data ?? [];
    },
  });

  const cnpjCounts = (data ?? []).reduce<Record<string, number>>((acc, a) => {
    if (a.cnpj) acc[a.cnpj] = (acc[a.cnpj] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = (data ?? []).filter((a) => {
    const term = q.toLowerCase();
    if (q &&
      !(a.trade_name ?? "").toLowerCase().includes(term) &&
      !(a.legal_name ?? "").toLowerCase().includes(term) &&
      !(a.responsible_email ?? "").toLowerCase().includes(term) &&
      !(a.cnpj ?? "").includes(q)
    ) return false;
    if (filter === "ALL") return a.status !== "DRAFT";
    if (filter === "HIGH_POTENTIAL") return a.high_potential;
    if (filter === "DUPLICATE") return a.cnpj && cnpjCounts[a.cnpj] > 1;
    return a.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border border-border bg-background px-3 h-10">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Buscar por nome ou CNPJ..." />
        </div>
        {STATUS_FILTERS.map((s) => (
          <button key={s.v} onClick={() => setFilter(s.v)}
            className={"px-3 h-9 rounded-xl text-xs font-bold " + (filter === s.v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-muted")}>
            {s.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Não foi possível carregar os credenciamentos. Atualize a página e tente novamente.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum credenciamento encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const isDup = a.cnpj && cnpjCounts[a.cnpj] > 1;
            return (
              <Link key={a.id} to="/admin/credenciamento-instituicoes/$id" params={{ id: a.id }}
                className="block rounded-2xl border border-border bg-card p-4 hover:border-primary transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-bold truncate">{a.trade_name ?? "(sem nome)"}</h3>
                      {a.high_potential && <Star className="h-4 w-4 text-accent fill-accent" />}
                      {isDup && <Badge className="bg-warning/15 text-warning-foreground border-0">CNPJ duplicado</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                      <span>CNPJ: {a.cnpj ?? "—"}</span>
                      <span>{a.city ?? "—"}/{a.state ?? "—"}</span>
                      <span>Resp.: {a.responsible_name ?? "—"}</span>
                      <span>{a.submitted_at ? `Enviado ${new Date(a.submitted_at).toLocaleDateString("pt-BR")}` : `Criado ${new Date(a.created_at).toLocaleDateString("pt-BR")}`}</span>
                    </div>
                  </div>
                  <Badge className={(TONES[a.status] ?? "") + " border-0"}>
                    {a.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
                     a.status === "REJECTED" || a.status === "SUSPENDED" ? <AlertCircle className="h-3 w-3 mr-1" /> :
                     <Clock className="h-3 w-3 mr-1" />}
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
