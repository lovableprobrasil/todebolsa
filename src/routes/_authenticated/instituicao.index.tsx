import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, ArrowRight, Clock, CheckCircle2, AlertCircle, Ban } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/instituicao/")({
  component: InstitutionPortalIndex,
});

const STATUS: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Em análise", tone: "bg-warning/15 text-warning-foreground", icon: Clock },
  APPROVED: { label: "Aprovada", tone: "bg-primary-soft text-primary", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspensa", tone: "bg-destructive/15 text-destructive", icon: AlertCircle },
  REJECTED: { label: "Recusada", tone: "bg-muted text-muted-foreground", icon: Ban },
};

function InstitutionPortalIndex() {
  const { institutionAdminOf } = useAuth();

  const { data: institutions, isLoading } = useQuery({
    enabled: institutionAdminOf.length > 0,
    queryKey: ["my-institutions", institutionAdminOf],
    queryFn: async () => {
      const { data } = await supabase
        .from("institutions")
        .select("id, slug, trade_name, status, logo_url, email, created_at")
        .in("id", institutionAdminOf)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> Portal da instituição
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas instituições, unidades, cursos e bolsas.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/instituicao/cadastrar">
            <Plus className="h-4 w-4" /> Cadastrar instituição
          </Link>
        </Button>
      </header>

      {institutionAdminOf.length === 0 ? (
        <EmptyState />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {institutions?.map((i) => {
            const meta = STATUS[i.status] ?? STATUS.PENDING;
            const Icon = meta.icon;
            return (
              <Link
                key={i.id}
                to="/instituicao/$id"
                params={{ id: i.id }}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                    {i.logo_url ? (
                      <img src={i.logo_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg truncate">{i.trade_name}</h3>
                      <Badge className={meta.tone + " border-0"}>
                        <Icon className="h-3 w-3 mr-1" /> {meta.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">{i.email ?? "—"}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
        <Building2 className="h-7 w-7" />
      </div>
      <h2 className="font-display text-xl font-bold mb-2">Você ainda não tem instituição cadastrada</h2>
      <p className="text-muted-foreground mb-5 max-w-md mx-auto">
        Cadastre sua escola, faculdade ou curso para começar a oferecer bolsas no Tô de Bolsa.
        A aprovação é feita pela nossa equipe.
      </p>
      <Button asChild>
        <Link to="/instituicao/cadastrar">
          <Plus className="h-4 w-4 mr-1" /> Cadastrar minha instituição
        </Link>
      </Button>
    </div>
  );
}
