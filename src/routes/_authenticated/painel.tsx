import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Bookmark, IdCard, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { recommendScholarships } from "@/lib/scholarships";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/painel")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "PLATFORM_ADMIN")
      .maybeSingle();
    if (adminRole) throw redirect({ to: "/admin" });
  },
  component: PainelPage,
});

function PainelPage() {
  const { user, profile } = useAuth();
  const uid = user?.id;

  const { data: counts } = useQuery({
    enabled: !!uid,
    queryKey: ["dashboard-counts", uid],
    queryFn: async () => {
      const [fav, res] = await Promise.all([
        supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", uid!),
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("user_id", uid!),
      ]);
      return { favorites: fav.count ?? 0, reservations: res.count ?? 0 };
    },
  });

  const { data: recs = [] } = useQuery({
    enabled: !!uid,
    queryKey: ["recommendations", uid],
    queryFn: () => recommendScholarships(uid!, 6),
  });

  const name = profile?.name?.split(" ")[0] ?? "Estudante";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Olá, {name}!</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas bolsas, reservas e sua carteira UGE.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Heart}
          label="Favoritos"
          value={counts?.favorites ?? 0}
          to="/favoritos"
        />
        <StatCard
          icon={Bookmark}
          label="Reservas ativas"
          value={counts?.reservations ?? 0}
          to="/reservas"
        />
        <StatCard
          icon={IdCard}
          label="Carteira UGE"
          value="Disponível"
          to="/carteira"
          accent
        />
      </div>

      <section className="rounded-3xl bg-hero text-hero-foreground p-6 md:p-8 relative overflow-hidden">
        <div aria-hidden className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Recomendação
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-2">
              Encontre novas bolsas com até 90% OFF
            </h2>
            <p className="text-hero-muted max-w-xl">
              Acabamos de cadastrar novas oportunidades. Explore o marketplace e garanta sua vaga.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/bolsas">
              Buscar bolsas <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {recs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Recomendado para você
            </h2>
            <Link to="/bolsas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recs.map((s) => <ScholarshipCard key={s.id} s={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, to, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  to: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-accent text-accent-foreground" : "bg-primary-soft text-primary"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </Link>
  );
}
