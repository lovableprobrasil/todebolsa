import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Search, Star, CheckCircle2, XCircle, Pause, Play, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/instituicoes")({
  component: AdminInstitutions,
});

const STATUS_TONE: Record<string, string> = {
  APPROVED: "bg-primary-soft text-primary",
  PENDING: "bg-warning/15 text-warning-foreground",
  SUSPENDED: "bg-destructive/15 text-destructive",
  REJECTED: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprovada",
  PENDING: "Pendente",
  SUSPENDED: "Suspensa",
  REJECTED: "Recusada",
};

const STATUS_FILTER_LABEL: Record<string, string> = {
  ALL: "Todas",
  PENDING: "Pendentes",
  APPROVED: "Aprovadas",
  SUSPENDED: "Suspensas",
  REJECTED: "Recusadas",
};

function AdminInstitutions() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_institutions");
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "PENDING" | "SUSPENDED" | "REJECTED" }) => {
      const { error } = await supabase.rpc("set_institution_status", { p_institution_id: id, p_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Status atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const featureMut = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.rpc("toggle_institution_feature", { p_institution_id: id, p_featured: featured });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-institutions"] }),
  });

  const filtered = (data ?? []).filter((i) => {
    if (status !== "ALL" && i.status !== status) return false;
    if (q && !i.trade_name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border border-border bg-background px-3 h-10">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Buscar instituição..." />
        </div>
        {["ALL", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={"px-3 h-9 rounded-xl text-xs font-bold " + (status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-muted")}>
            {STATUS_FILTER_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhuma instituição encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <div key={i.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-bold truncate">{i.trade_name}</h3>
                    {i.is_featured && <Star className="h-4 w-4 text-accent fill-accent" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {i.email ?? "—"} · {i.phone ?? "—"} · cadastrada em {new Date(i.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={(STATUS_TONE[i.status] ?? "") + " border-0"}>{STATUS_LABEL[i.status] ?? i.status}</Badge>
                  <a href={"/instituicoes/" + i.slug} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Ver página <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {i.status !== "APPROVED" && (
                  <Button size="sm" onClick={() => setStatusMut.mutate({ id: i.id, status: "APPROVED" })}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                )}
                {i.status !== "SUSPENDED" && i.status === "APPROVED" && (
                  <Button size="sm" variant="outline" onClick={() => setStatusMut.mutate({ id: i.id, status: "SUSPENDED" })}>
                    <Pause className="h-4 w-4 mr-1" /> Suspender
                  </Button>
                )}
                {i.status === "SUSPENDED" && (
                  <Button size="sm" onClick={() => setStatusMut.mutate({ id: i.id, status: "APPROVED" })}>
                    <Play className="h-4 w-4 mr-1" /> Reativar
                  </Button>
                )}
                {i.status === "PENDING" && (
                  <Button size="sm" variant="outline" onClick={() => setStatusMut.mutate({ id: i.id, status: "REJECTED" })}>
                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => featureMut.mutate({ id: i.id, featured: !i.is_featured })}>
                  <Star className={"h-4 w-4 mr-1 " + (i.is_featured ? "fill-accent text-accent" : "")} />
                  {i.is_featured ? "Despromover" : "Destacar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
