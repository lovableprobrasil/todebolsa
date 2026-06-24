import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Building2, GraduationCap, Users, Bookmark, Briefcase, Wallet, Star, FileCheck2, Activity, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "PLATFORM_ADMIN")
      .maybeSingle();
    if (!roles) throw redirect({ to: "/admin/bootstrap" });
  },
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/instituicoes", label: "Instituições", icon: Building2, exact: false },
  { to: "/admin/bolsas", label: "Bolsas", icon: GraduationCap, exact: false },
  { to: "/admin/reservas", label: "Reservas", icon: Bookmark, exact: false },
  { to: "/admin/matriculas", label: "Matrículas", icon: FileCheck2, exact: false },
  { to: "/admin/crm", label: "CRM & Comercial", icon: Briefcase, exact: false },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: Activity, exact: false },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star, exact: false },
  { to: "/admin/indicacoes", label: "Indicações", icon: Gift, exact: false },
  { to: "/admin/usuarios", label: "Usuários", icon: Users, exact: false },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-brand-blue to-brand-blue/80 text-brand-blue-foreground p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold">Painel Master</h1>
            <p className="text-sm text-white/80">Moderação, métricas e gestão da plataforma.</p>
          </div>
        </div>
      </header>

      <nav className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 scroll-snap-x lg:flex-wrap lg:overflow-visible">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "scroll-snap-start flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
