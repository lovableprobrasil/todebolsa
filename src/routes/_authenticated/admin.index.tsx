import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, Users, Bookmark, CheckCircle2, AlertCircle, BanknoteIcon, TrendingUp, FileCheck2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

type Stats = {
  institutions_total: number; institutions_pending: number; institutions_approved: number; institutions_suspended: number;
  applications_pending: number; applications_recent: number;
  scholarships_active: number; scholarships_total: number;
  students_total: number;
  reservations_total: number; reservations_pending: number; reservations_confirmed: number; reservations_expired: number;
  gmv_paid: number; payments_count: number;
  recent_signups: number; recent_reservations: number;
};

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw error;
      return data as Stats;
    },
  });

  if (isLoading || !data) return <div className="h-64 rounded-3xl bg-muted animate-pulse" />;

  return (
    <div className="space-y-6">
      {data.applications_pending > 0 && (
        <Link
          to="/admin/credenciamento-instituicoes"
          className="block rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/15 to-warning/5 p-5 hover:border-warning transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground shrink-0">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-display text-lg font-extrabold">
                  {data.applications_pending} credenciamento{data.applications_pending === 1 ? "" : "s"} aguardando análise
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.applications_recent} enviado{data.applications_recent === 1 ? "" : "s"} nos últimos 7 dias · Clique para revisar
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-foreground/60 shrink-0" />
          </div>
        </Link>
      )}

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Building2} label="Instituições" value={data.institutions_total} hint={`${data.institutions_pending} aguardando aprovação`} tone="blue" />
        <Stat icon={GraduationCap} label="Bolsas ativas" value={data.scholarships_active} hint={`${data.scholarships_total} no total`} tone="primary" />
        <Stat icon={Users} label="Estudantes" value={data.students_total} hint={`+${data.recent_signups} esta semana`} tone="accent" />
        <Stat icon={Bookmark} label="Reservas" value={data.reservations_total} hint={`+${data.recent_reservations} esta semana`} tone="primary" />
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <BigStat icon={AlertCircle} label="Pagamentos pendentes" value={data.reservations_pending} tone="warn" />
        <BigStat icon={CheckCircle2} label="Reservas confirmadas" value={data.reservations_confirmed} tone="primary" />
        <BigStat icon={BanknoteIcon} label="GMV pago" value={formatBRL(Number(data.gmv_paid))} hint={`${data.payments_count} pagamentos`} tone="blue" />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Pie title="Funil de instituições" segments={[
          { label: "Aprovadas", value: data.institutions_approved, color: "bg-primary" },
          { label: "Pendentes", value: data.institutions_pending, color: "bg-warning" },
          { label: "Suspensas", value: data.institutions_suspended, color: "bg-destructive" },
        ]} />
        <Pie title="Funil de reservas" segments={[
          { label: "Confirmadas", value: data.reservations_confirmed, color: "bg-primary" },
          { label: "Aguardando", value: data.reservations_pending, color: "bg-warning" },
          { label: "Expiradas", value: data.reservations_expired, color: "bg-destructive" },
        ]} />
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; hint?: string;
  tone: "blue" | "primary" | "accent";
}) {
  const tones: Record<string, string> = {
    blue: "bg-brand-blue-soft text-brand-blue",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent/15 text-accent",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={"inline-flex h-10 w-10 items-center justify-center rounded-xl " + tones[tone]}><Icon className="h-5 w-5" /></div>
      <div className="font-display text-3xl font-extrabold mt-3">{value}</div>
      <div className="text-sm font-medium text-foreground/80 mt-0.5">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function BigStat({ icon: Icon, label, value, hint, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; hint?: string;
  tone: "warn" | "primary" | "blue";
}) {
  const tones: Record<string, string> = {
    warn: "from-warning/20 to-warning/5 border-warning/30",
    primary: "from-primary/15 to-primary/5 border-primary/30",
    blue: "from-brand-blue/15 to-brand-blue/5 border-brand-blue/30",
  };
  return (
    <div className={"rounded-2xl border bg-gradient-to-br p-5 " + tones[tone]}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground/80">{label}</div>
        <Icon className="h-5 w-5 text-foreground/60" />
      </div>
      <div className="font-display text-4xl font-extrabold mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Pie({ title, segments }: { title: string; segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold">{title}</h3>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-secondary">
        {segments.map((s) => (
          <div key={s.label} className={s.color} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><span className={"h-2.5 w-2.5 rounded-full " + s.color} />{s.label}</span>
            <span className="font-bold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
