import { createFileRoute, Outlet, Link, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, Heart, Bookmark, IdCard, UserCircle, LogOut, Menu, X, Building2, Bell, Shield } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/site/NotificationsBell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

const STUDENT_NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/reservas", label: "Minhas reservas", icon: Bookmark },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/carteira", label: "Carteira UGE", icon: IdCard },
  { to: "/perfil", label: "Meu perfil", icon: UserCircle },
] as const;

const ADMIN_NAV = [
  { to: "/admin", label: "Painel master", icon: Shield },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/perfil", label: "Meu perfil", icon: UserCircle },
] as const;

const INSTITUTION_NAV = [
  { to: "/instituicao", label: "Portal da instituição", icon: Building2 },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/perfil", label: "Meu perfil", icon: UserCircle },
] as const;

function AuthenticatedLayout() {
  const { profile, user, signOut, isPlatformAdmin, institutionAdminOf } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = isPlatformAdmin
    ? ADMIN_NAV
    : institutionAdminOf.length > 0
      ? INSTITUTION_NAV
      : STUDENT_NAV;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? "Estudante";
  const initials = displayName.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display font-bold tracking-tight hidden sm:inline">
                Tô de <span className="text-primary">Bolsa</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm">
                {initials || "?"}
              </span>
              <div className="text-sm leading-tight">
                <div className="font-semibold truncate max-w-[160px]">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[160px]">{user?.email}</div>
              </div>
            </div>
            <NotificationsBell />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {nav.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-card hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="lg:hidden -mt-2 -mx-1 mb-2">
              <nav className="rounded-2xl border border-border bg-card p-2 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70 hover:bg-secondary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
