import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Gift, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/indicacoes")({
  component: AdminReferralPage,
});

function AdminReferralPage() {
  const qc = useQueryClient();

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_payouts")
        .select("*, profile:profiles!inner(name, email)")
        .order("requested_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "PAID" | "REJECTED" }) => {
      const { error } = await supabase
        .from("referral_payouts")
        .update({ status, processed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-border bg-card p-6 flex items-center gap-3">
        <Gift className="h-6 w-6 text-primary" />
        <div>
          <h2 className="font-display text-xl font-extrabold">Programa de Indicação — Saques PIX</h2>
          <p className="text-sm text-muted-foreground">Aprovar ou recusar saques solicitados pelos indicadores.</p>
        </div>
      </header>

      {isLoading && <div className="h-40 rounded-3xl bg-muted animate-pulse" />}

      <div className="space-y-2">
        {payouts.map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="font-bold">{p.profile?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{p.profile?.email}</div>
              <div className="text-xs mt-1">
                {p.pix_key_type}: <span className="font-mono">{p.pix_key}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-extrabold text-lg">{formatBRL(Number(p.amount))}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(p.requested_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <Badge className="border-0 bg-primary-soft text-primary">{p.status}</Badge>
            {p.status === "REQUESTED" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "PAID" })}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como pago
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: p.id, status: "REJECTED" })}>
                  <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              </div>
            )}
          </div>
        ))}
        {!isLoading && payouts.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            Nenhum saque solicitado.
          </div>
        )}
      </div>
    </div>
  );
}
