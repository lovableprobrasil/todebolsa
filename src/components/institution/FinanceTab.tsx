import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { TrendingUp, RotateCcw, Receipt, Clock, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Overview = {
  gross_revenue: number;
  refunds_total: number;
  net_revenue: number;
  payments_count: number;
  refunds_count: number;
  avg_ticket: number;
  revenue_7d: number;
  revenue_30d: number;
  pending_payments: number;
  monthly: { month: string; revenue: number; payments: number }[];
  recent: {
    id: string;
    reservation_code: string;
    amount_paid: number;
    payment_method: string | null;
    updated_at: string;
    scholarship_title: string | null;
  }[];
};

export function FinanceTab({ institutionId }: { institutionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["institution-finance", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("institution_finance_overview", {
        p_institution_id: institutionId,
      });
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  if (isLoading || !data) {
    return <div className="h-48 animate-pulse rounded-3xl bg-muted" />;
  }

  const max = Math.max(1, ...data.monthly.map((m) => Number(m.revenue)));

  function downloadCsv() {
    const header = ["codigo", "bolsa", "metodo_pagamento", "valor", "data"];
    const rows = data!.recent.map((r) => [
      r.reservation_code,
      (r.scholarship_title ?? "").replaceAll('"', '""'),
      r.payment_method ?? "",
      Number(r.amount_paid).toFixed(2),
      new Date(r.updated_at).toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receitas-${institutionId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Como funciona:</strong> o aluno paga a taxa de matrícula direto ao Tô de Bolsa,
        que emite a carta de apresentação. Não há repasse financeiro para a instituição — este
        relatório serve apenas para acompanhamento das conversões geradas pela sua marca.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Receita gerada" value={formatBRL(data.gross_revenue)} hint={`${data.payments_count} pagamentos`} tone="primary" />
        <Stat icon={RotateCcw} label="Reembolsos" value={formatBRL(data.refunds_total)} hint={`${data.refunds_count} estornados`} tone="warn" />
        <Stat icon={TrendingUp} label="Receita líquida" value={formatBRL(data.net_revenue)} hint="Bruta − reembolsos" tone="success" />
        <Stat icon={Receipt} label="Ticket médio" value={formatBRL(data.avg_ticket)} hint="por matrícula paga" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="Últimos 7 dias" value={formatBRL(data.revenue_7d)} />
        <Stat icon={TrendingUp} label="Últimos 30 dias" value={formatBRL(data.revenue_30d)} />
        <Stat icon={Clock} label="Pagamentos pendentes" value={String(data.pending_payments)} hint="reservas aguardando taxa" />
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-4">Receita mensal (12 meses)</h2>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem receita registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground tabular-nums">{m.month}</div>
                <div className="flex-1 h-6 rounded bg-secondary/60 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(Number(m.revenue) / max) * 100}%` }} />
                </div>
                <div className="w-32 text-right text-sm font-medium tabular-nums">{formatBRL(m.revenue)}</div>
                <div className="w-16 text-right text-xs text-muted-foreground tabular-nums">{m.payments} pgto</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="font-display text-lg font-extrabold">Últimas matrículas pagas</h2>
          <Button size="sm" variant="outline" onClick={downloadCsv} disabled={data.recent.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma matrícula paga ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left py-2 px-2">Código</th>
                  <th className="text-left py-2 px-2">Bolsa</th>
                  <th className="text-left py-2 px-2">Método</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-right py-2 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 px-2 font-mono text-xs">{r.reservation_code}</td>
                    <td className="py-2 px-2">{r.scholarship_title ?? "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.payment_method ?? "—"}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{formatBRL(r.amount_paid)}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground tabular-nums">
                      {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hint, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; hint?: string;
  tone?: "primary" | "success" | "warn";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "warn" ? "text-amber-600" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-4 w-4 ${toneClass}`} /> {label}
      </div>
      <div className={`font-display text-2xl font-extrabold mt-1 ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
