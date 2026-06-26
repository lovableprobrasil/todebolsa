import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RotateCcw, Search, AlertCircle } from "lucide-react";
import { processRefund } from "@/lib/refunds.functions";

export const Route = createFileRoute("/_authenticated/admin/financeiro/reembolsos")({
  component: RefundsPage,
});

type Refund = {
  id: string;
  amount: number;
  reason: string | null;
  status: string;
  processed_at: string | null;
  requested_at: string | null;
  stripe_refund_id: string | null;
  reservation_id: string;
  reservations: {
    reservation_code: string;
    amount_paid: number;
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

type Env = "sandbox" | "live";

function RefundsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<PaidReservation | null>(null);
  const [reason, setReason] = useState("");
  const [env, setEnv] = useState<Env>("sandbox");

  const refundsQ = useQuery({
    queryKey: ["refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select(`id, amount, reason, status, processed_at, requested_at, stripe_refund_id, reservation_id,
          reservations:reservation_id (
            reservation_code, amount_paid,
            profiles:user_id (name, email),
            institutions:institution_id (trade_name)
          )`)
        .order("requested_at", { ascending: false })
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
    mutationFn: async (vars: { reservation_id: string; reason: string }) => {
      const res = await processRefund({
        data: { reservation_id: vars.reservation_id, reason: vars.reason, environment: env },
      });
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: (res) => {
      toast.success(
        res.stripe_refund_id
          ? `Reembolso Stripe ${res.stripe_refund_id} criado e aluno notificado.`
          : "Reembolso registrado (sem PI Stripe correspondente).",
      );
      setTarget(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["refunds"] });
      qc.invalidateQueries({ queryKey: ["reservations-paid-refundable"] });
      qc.invalidateQueries({ queryKey: ["finance-overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível reembolsar."),
  });

  const all = refundsQ.data ?? [];
  const pending = all.filter((r) => r.status === "REQUESTED");
  const processed = all.filter((r) => r.status !== "REQUESTED");

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

  const openDialogFor = (r: PaidReservation, presetReason = "") => {
    setTarget(r);
    setReason(presetReason);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Ambiente Stripe</span>
        <Select value={env} onValueChange={(v) => setEnv(v as Env)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">Sandbox (teste)</SelectItem>
            <SelectItem value="live">Live (produção)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          O reembolso é executado em refunds.create na Stripe + atualização local.
        </span>
      </section>

      {pending.length > 0 && (
        <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h2 className="font-display text-lg font-extrabold">Pedidos pendentes do aluno ({pending.length})</h2>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-100/60 text-xs uppercase text-amber-900">
                <tr>
                  <th className="text-left px-4 py-2">Data</th>
                  <th className="text-left px-4 py-2">Código</th>
                  <th className="text-left px-4 py-2">Aluno</th>
                  <th className="text-left px-4 py-2">Motivo</th>
                  <th className="text-right px-4 py-2">Valor</th>
                  <th className="text-right px-4 py-2 w-px"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} className="border-t border-amber-100">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {p.requested_at ? new Date(p.requested_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{p.reservations?.reservation_code ?? "—"}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{p.reservations?.profiles?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.reservations?.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-sm">{p.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatBRL(p.amount)}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          const reserv = (paidQ.data ?? []).find((r) => r.id === p.reservation_id);
                          if (!reserv) {
                            toast.error("Reserva não está mais disponível para reembolso.");
                            return;
                          }
                          openDialogFor(reserv, p.reason ?? "");
                        }}
                      >
                        Aprovar e estornar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-2">Reembolsar uma reserva paga</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Estorna o valor diretamente na Stripe, libera a vaga e marca a reserva como cancelada.
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
                      <Button variant="outline" size="sm" onClick={() => openDialogFor(r)}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reembolsar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolsar reserva {target?.reservation_code}</DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-3 text-sm">
              <p><strong>Aluno:</strong> {target.profiles?.name ?? target.profiles?.email}</p>
              <p><strong>Instituição:</strong> {target.institutions?.trade_name}</p>
              <p><strong>Valor:</strong> {formatBRL(target.amount_paid)}</p>
              <p className="text-xs text-muted-foreground">
                Ambiente: <strong className="uppercase">{env}</strong>. Será chamado <code>refunds.create</code> na Stripe.
              </p>
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
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setTarget(null); setReason(""); }}>Cancelar</Button>
            <Button
              onClick={() => target && refund.mutate({ reservation_id: target.id, reason })}
              disabled={refund.isPending || !target}
            >
              {refund.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-4">Histórico de reembolsos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-left px-4 py-2">Código</th>
                <th className="text-left px-4 py-2">Aluno</th>
                <th className="text-left px-4 py-2">Stripe</th>
                <th className="text-left px-4 py-2">Motivo</th>
                <th className="text-right px-4 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {refundsQ.isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!refundsQ.isLoading && processed.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum reembolso processado.</td></tr>
              )}
              {processed.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                    {r.processed_at ? new Date(r.processed_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.reservations?.reservation_code ?? "—"}</td>
                  <td className="px-4 py-2">{r.reservations?.profiles?.name ?? r.reservations?.profiles?.email ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{r.stripe_refund_id ?? "—"}</td>
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
