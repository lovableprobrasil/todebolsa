import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RotateCcw, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financeiro/reembolsos")({
  component: RefundsPage,
});

type Refund = {
  id: string;
  amount: number;
  reason: string | null;
  status: string;
  processed_at: string;
  reservations: {
    reservation_code: string;
    profiles: { name: string | null; email: string | null } | null;
    institutions: { trade_name: string } | null;
  } | null;
};

type PaidReservation = {
  id: string;
  reservation_code: string;
  amount_paid: number;
  status: string;
  payment_status: string;
  profiles: { name: string | null; email: string | null } | null;
  institutions: { trade_name: string } | null;
};

function RefundsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<PaidReservation | null>(null);
  const [reason, setReason] = useState("");

  const refundsQ = useQuery({
    queryKey: ["refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select(`id, amount, reason, status, processed_at,
          reservations:reservation_id (
            reservation_code,
            profiles:user_id (name, email),
            institutions:institution_id (trade_name)
          )`)
        .order("processed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Refund[];
    },
  });

  const paidQ = useQuery({
    queryKey: ["reservations-paid-refundable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`id, reservation_code, amount_paid, status, payment_status,
          profiles:user_id (name, email),
          institutions:institution_id (trade_name)`)
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as PaidReservation[];
    },
  });

  const refund = useMutation({
    mutationFn: async () => {
      if (!target) return;
      const { error } = await supabase.rpc("request_refund", {
        p_reservation_id: target.id,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reembolso processado e aluno notificado.");
      setTarget(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["refunds"] });
      qc.invalidateQueries({ queryKey: ["reservations-paid-refundable"] });
      qc.invalidateQueries({ queryKey: ["finance-overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível reembolsar."),
  });

  const paid = (paidQ.data ?? []).filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      r.reservation_code.toLowerCase().includes(t) ||
      r.profiles?.name?.toLowerCase().includes(t) ||
      r.profiles?.email?.toLowerCase().includes(t) ||
      r.institutions?.trade_name?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-2">Reembolsar uma reserva paga</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Devolve o valor da taxa de matrícula ao aluno, libera a vaga e marca a reserva como cancelada.
        </p>
        <div className="relative max-w-sm w-full mb-3">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar reserva paga…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2">Código</th>
                  <th className="text-left px-4 py-2">Aluno</th>
                  <th className="text-left px-4 py-2">Instituição</th>
                  <th className="text-right px-4 py-2">Valor</th>
                  <th className="text-right px-4 py-2 w-px"></th>
                </tr>
              </thead>
              <tbody>
                {paid.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma reserva paga encontrada.</td></tr>
                )}
                {paid.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{r.reservation_code}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{r.profiles?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-2">{r.institutions?.trade_name ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatBRL(r.amount_paid)}</td>
                    <td className="px-4 py-2 text-right">
                      <Dialog open={target?.id === r.id} onOpenChange={(o) => { if (!o) { setTarget(null); setReason(""); } }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setTarget(r)}>
                            <RotateCcw className="h-4 w-4 mr-1" /> Reembolsar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reembolsar reserva {r.reservation_code}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <p><strong>Aluno:</strong> {r.profiles?.name ?? r.profiles?.email}</p>
                            <p><strong>Instituição:</strong> {r.institutions?.trade_name}</p>
                            <p><strong>Valor:</strong> {formatBRL(r.amount_paid)}</p>
                            <div>
                              <label className="text-xs font-semibold uppercase text-muted-foreground">Motivo</label>
                              <Textarea
                                placeholder="Ex.: desistência do aluno dentro do prazo, instituição não pôde efetivar matrícula…"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => { setTarget(null); setReason(""); }}>Cancelar</Button>
                            <Button onClick={() => refund.mutate()} disabled={refund.isPending}>
                              {refund.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Confirmar reembolso
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-4">Histórico de reembolsos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-left px-4 py-2">Código</th>
                <th className="text-left px-4 py-2">Aluno</th>
                <th className="text-left px-4 py-2">Instituição</th>
                <th className="text-left px-4 py-2">Motivo</th>
                <th className="text-right px-4 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {refundsQ.isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!refundsQ.isLoading && (refundsQ.data ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum reembolso registrado.</td></tr>
              )}
              {(refundsQ.data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(r.processed_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.reservations?.reservation_code ?? "—"}</td>
                  <td className="px-4 py-2">{r.reservations?.profiles?.name ?? r.reservations?.profiles?.email ?? "—"}</td>
                  <td className="px-4 py-2">{r.reservations?.institutions?.trade_name ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground max-w-xs truncate">{r.reason ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-amber-600">−{formatBRL(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
