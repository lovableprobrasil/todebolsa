import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { TrendingUp, RotateCcw, Receipt, Clock, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financeiro/")({
  component: FinanceOverview,
});

type Overview = {
  gross_revenue: number;
  refunds_total: number;
  net_revenue: number;
  payments_count: number;
  refunds_count: number;
  avg_ticket: number;
  revenue_30d: number;
  revenue_7d: number;
  pending_payments: number;
  monthly: { month: string; revenue: number; payments: number }[];
};

function FinanceOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["finance-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("finance_overview");
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  if (isLoading || !data) {
    return <div className="h-48 animate-pulse rounded-3xl bg-muted" />;
  }

  const max = Math.max(1, ...data.monthly.map((m) => Number(m.revenue)));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Receita bruta" value={formatBRL(data.gross_revenue)} hint={`${data.payments_count} pagamentos`} tone="primary" />
        <Stat icon={RotateCcw} label="Reembolsos" value={formatBRL(data.refunds_total)} hint={`${data.refunds_count} estornados`} tone="warn" />
        <Stat icon={TrendingUp} label="Receita líquida" value={formatBRL(data.net_revenue)} hint="Bruta − reembolsos" tone="success" />
        <Stat icon={Receipt} label="Ticket médio" value={formatBRL(data.avg_ticket)} hint="por matrícula paga" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="Receita últimos 7 dias" value={formatBRL(data.revenue_7d)} />
        <Stat icon={TrendingUp} label="Receita últimos 30 dias" value={formatBRL(data.revenue_30d)} />
        <Stat icon={Clock} label="Pagamentos pendentes" value={String(data.pending_payments)} hint="reservas aguardando taxa" />
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold mb-4">Receita mensal (últimos 12 meses)</h2>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma receita registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground tabular-nums">{m.month}</div>
                <div className="flex-1 h-6 rounded bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(Number(m.revenue) / max) * 100}%` }}
                  />
                </div>
                <div className="w-32 text-right text-sm font-medium tabular-nums">{formatBRL(m.revenue)}</div>
                <div className="w-16 text-right text-xs text-muted-foreground tabular-nums">{m.payments} pgto</div>
              </div>
            ))}
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
