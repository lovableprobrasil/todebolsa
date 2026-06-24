import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, RotateCcw, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: FinanceLayout,
});

const SUBTABS = [
  { to: "/admin/financeiro", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/financeiro/receitas", label: "Receitas", icon: Receipt, exact: false },
  { to: "/admin/financeiro/reembolsos", label: "Reembolsos", icon: RotateCcw, exact: false },
  { to: "/admin/financeiro/instituicoes", label: "Por instituição", icon: Building2, exact: false },
] as const;

function FinanceLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Modelo financeiro:</strong> o aluno paga a taxa de matrícula direto ao Tô de Bolsa.
        Não há split nem repasse para as instituições — os relatórios por instituição são apenas
        para gestão comercial interna.
      </div>
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
