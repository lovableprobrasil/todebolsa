import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Building2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  component: CrmLayout,
});

const SUBTABS = [
  { to: "/admin/crm", label: "Painel comercial", icon: LayoutDashboard, exact: true },
  { to: "/admin/crm/leads", label: "Leads de alunos", icon: Inbox, exact: false },
  { to: "/admin/crm/instituicoes", label: "Prospecção de instituições", icon: Building2, exact: false },
  { to: "/admin/crm/atividades", label: "Atividades & tarefas", icon: ListChecks, exact: false },
] as const;

function CrmLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1">
        {SUBTABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
