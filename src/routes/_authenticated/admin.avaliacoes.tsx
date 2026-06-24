import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: AvaliacoesPage,
});

type Status = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  moderation_notes: string | null;
  profiles: { name: string | null; email: string | null } | null;
  institutions: { trade_name: string | null; slug: string | null } | null;
};

function AvaliacoesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("PENDING");

  const { data: rows, isLoading } = useQuery<Row[]>({
    queryKey: ["admin-reviews", status],
    queryFn: async () => {
      let q = supabase
        .from("institution_reviews")
        .select(`
          id, rating, comment, status, created_at, moderation_notes,
          profiles:profiles!institution_reviews_user_id_fkey(name, email),
          institutions:institutions!institution_reviews_institution_id_fkey(trade_name, slug)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "ALL") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const moderate = useMutation({
    mutationFn: async (input: { id: string; approve: boolean; notes?: string }) => {
      const { error } = await supabase.rpc("moderate_review", {
        p_review_id: input.id,
        p_approve: input.approve,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Moderação aplicada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
          <Star className="h-5 w-5 text-warning fill-warning" /> Moderação de avaliações
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Apenas avaliações aprovadas aparecem publicamente nas páginas das instituições.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/80"
              }`}
            >
              {s === "PENDING" ? "Pendentes" : s === "APPROVED" ? "Aprovadas" : s === "REJECTED" ? "Rejeitadas" : "Todas"}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="h-40 rounded-3xl bg-muted animate-pulse" />
      ) : !rows || rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhuma avaliação nesta categoria.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">
                    {r.institutions?.trade_name ?? "—"} ·{" "}
                    <span>{r.profiles?.name ?? "Aluno"}</span>{" "}
                    <span className="text-xs">({r.profiles?.email})</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <ReviewStars value={r.rating} readOnly />
                    <Badge variant={r.status === "PENDING" ? "secondary" : r.status === "APPROVED" ? "default" : "destructive"}>
                      {r.status === "PENDING" ? "Pendente" : r.status === "APPROVED" ? "Aprovada" : "Rejeitada"}
                    </Badge>
                  </div>
                  {r.comment && <p className="text-sm mt-2 leading-relaxed">{r.comment}</p>}
                  {r.moderation_notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Nota: {r.moderation_notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => moderate.mutate({ id: r.id, approve: true })}
                      disabled={moderate.isPending}
                    >
                      {moderate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Aprovar
                    </Button>
                  )}
                  {r.status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const notes = window.prompt("Motivo (opcional, será mostrado ao aluno):") ?? "";
                        moderate.mutate({ id: r.id, approve: false, notes });
                      }}
                      disabled={moderate.isPending}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
