import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, Building2, ListChecks, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm/")({
  component: CrmOverview,
});

type Overview = {
  leads_total: number; leads_new: number; leads_contacted: number; leads_interested: number;
  leads_won: number; leads_lost: number; leads_7d: number;
  prospects_total: number; prospects_won: number; prospects_active: number;
  tasks_open: number; tasks_overdue: number;
};

function CrmOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["crm-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("crm_overview");
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  if (isLoading) return <div className="h-60 rounded-2xl bg-muted animate-pulse" />;
  if (!data) return null;
  const conv = data.leads_total > 0 ? Math.round((data.leads_won / data.leads_total) * 100) : 0;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-xl font-bold">Painel comercial</h2>
        <p className="text-sm text-muted-foreground">Visão consolidada dos leads de alunos e da prospecção de instituições parceiras.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat icon={Inbox} label="Leads totais" value={data.leads_total} hint={`+${data.leads_7d} nos últimos 7 dias`} />
        <Stat icon={TrendingUp} label="Conversão" value={`${conv}%`} hint={`${data.leads_won} convertidos`} />
        <Stat icon={Building2} label="Instituições em prospecção" value={data.prospects_active} hint={`${data.prospects_won} fechadas`} />
        <Stat icon={ListChecks} label="Tarefas em aberto" value={data.tasks_open} hint={`${data.tasks_overdue} atrasadas`} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-base font-bold">Funil de leads</h3>
        <FunnelRow label="Novos" count={data.leads_new} total={data.leads_total} tone="bg-warning" />
        <FunnelRow label="Contatados" count={data.leads_contacted} total={data.leads_total} tone="bg-primary/60" />
        <FunnelRow label="Interessados" count={data.leads_interested} total={data.leads_total} tone="bg-primary" />
        <FunnelRow label="Ganhos" count={data.leads_won} total={data.leads_total} tone="bg-success" />
        <FunnelRow label="Perdidos" count={data.leads_lost} total={data.leads_total} tone="bg-destructive/60" />
      </section>

      {data.tasks_overdue > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning-foreground" />
          <p className="text-sm">Você tem <strong>{data.tasks_overdue}</strong> tarefa(s) comercial(is) atrasada(s).</p>
        </div>
      )}
      {data.tasks_overdue === 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="text-sm">Nenhuma tarefa comercial atrasada. Bom trabalho!</p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs"><Icon className="h-4 w-4" /> {label}</div>
      <div className="font-display text-2xl font-extrabold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function FunnelRow({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="text-muted-foreground">{count} · {pct}%</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
