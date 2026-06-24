import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Eye, GraduationCap, MousePointerClick, ShoppingBag, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

const RANGES = [7, 30, 90] as const;

type Funnel = {
  period_days: number;
  visits: { unique_sessions: number; pageviews: number };
  scholarship_views: { total: number; unique_scholarships: number };
  reservations: { reservations_count: number; paid_count: number; enrolled_count: number };
  top_institutions: Array<{ trade_name: string; views: number }>;
  daily: Array<{ day: string; sessions: number; events: number }>;
};

function AnalyticsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["funnel-overview", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("funnel_overview", { p_days: days });
      if (error) throw error;
      return data as unknown as Funnel;
    },
  });

  const visits = data?.visits.unique_sessions ?? 0;
  const reservs = data?.reservations.reservations_count ?? 0;
  const paid = data?.reservations.paid_count ?? 0;
  const enrolled = data?.reservations.enrolled_count ?? 0;
  const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "—");

  const maxDaily = Math.max(1, ...(data?.daily ?? []).map((d) => d.sessions));

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-display text-xl font-extrabold">Analytics & Funil</h2>
            <p className="text-sm text-muted-foreground">Visitas, conversões e desempenho do funil de matrícula.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                days === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </header>

      {isLoading && <div className="h-64 rounded-3xl bg-muted animate-pulse" />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Eye} label="Visitantes únicos" value={visits.toString()} hint={`${data?.visits.pageviews ?? 0} pageviews`} />
        <Stat icon={MousePointerClick} label="Bolsas visualizadas" value={(data?.scholarship_views.total ?? 0).toString()} hint={`${data?.scholarship_views.unique_scholarships ?? 0} bolsas únicas`} />
        <Stat icon={ShoppingBag} label="Reservas" value={reservs.toString()} hint={`Conv. ${pct(reservs, visits)}`} />
        <Stat icon={GraduationCap} label="Matrículas concluídas" value={enrolled.toString()} hint={`Conv. ${pct(enrolled, reservs)}`} />
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Funil de conversão</h3>
          <div className="mt-4 space-y-3">
            <FunnelBar label="Visitantes" value={visits} max={visits} />
            <FunnelBar label="Reservaram" value={reservs} max={visits} />
            <FunnelBar label="Pagaram taxa" value={paid} max={visits} />
            <FunnelBar label="Matriculados" value={enrolled} max={visits} />
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display font-bold">Top instituições</h3>
          <ul className="mt-4 space-y-2">
            {(data?.top_institutions ?? []).map((i) => (
              <li key={i.trade_name} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                <span className="text-sm font-medium truncate">{i.trade_name}</span>
                <span className="text-xs text-muted-foreground">{i.views} views</span>
              </li>
            ))}
            {(data?.top_institutions ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground italic">Sem dados ainda.</li>
            )}
          </ul>
        </article>
      </section>

      <article className="rounded-3xl border border-border bg-card p-6">
        <h3 className="font-display font-bold">Atividade diária</h3>
        <div className="mt-4 grid grid-cols-7 sm:grid-cols-15 lg:grid-cols-30 gap-1 items-end h-32">
          {(data?.daily ?? []).slice(-30).map((d) => (
            <div
              key={d.day}
              title={`${d.day} · ${d.sessions} sessões`}
              className="bg-primary/60 hover:bg-primary rounded-sm transition-colors"
              style={{ height: `${(d.sessions / maxDaily) * 100}%`, minHeight: 4 }}
            />
          ))}
        </div>
      </article>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="text-xs text-muted-foreground mt-3 uppercase tracking-wide">{label}</div>
      <div className="font-display text-2xl font-extrabold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value.toLocaleString("pt-BR")}</span>
      </div>
      <div className="mt-1 h-3 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.max(2, w)}%` }} />
      </div>
    </div>
  );
}
