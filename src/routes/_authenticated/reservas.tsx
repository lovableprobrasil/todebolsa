import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Clock, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reservas")({
  component: ReservasPage,
});

const STATUS: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  RESERVED: { label: "Reservada", tone: "bg-brand-blue-soft text-brand-blue", icon: Clock },
  PAYMENT_PENDING: { label: "Pagamento pendente", tone: "bg-warning/15 text-warning-foreground", icon: AlertCircle },
  CONFIRMED: { label: "Confirmada", tone: "bg-primary-soft text-primary", icon: CheckCircle2 },
  UNDER_REVIEW: { label: "Em análise", tone: "bg-warning/15 text-warning-foreground", icon: Clock },
  AWAITING_ENROLLMENT: { label: "Aguardando matrícula", tone: "bg-brand-blue-soft text-brand-blue", icon: Clock },
  ENROLLMENT_APPROVED: { label: "Matrícula aprovada", tone: "bg-primary text-primary-foreground", icon: CheckCircle2 },
  ENROLLMENT_REJECTED: { label: "Matrícula recusada", tone: "bg-destructive/15 text-destructive", icon: XCircle },
  EXPIRED: { label: "Expirada", tone: "bg-muted text-muted-foreground", icon: XCircle },
  CANCELLED: { label: "Cancelada", tone: "bg-muted text-muted-foreground", icon: XCircle },
};

function ReservasPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data, isLoading } = useQuery({
    enabled: !!uid,
    queryKey: ["reservations", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select(`
          id, status, created_at, expires_at, locked_price,
          scholarship:scholarships(
            id, price_with_scholarship,
            course_offering:course_offerings(
              course:courses(name, level, original_price, institution:institutions(trade_name))
            )
          )
        `)
        .eq("user_id", uid!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Bookmark className="h-7 w-7 text-primary" /> Minhas reservas
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe o status das bolsas que você reservou.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
            <Bookmark className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Você ainda não reservou nenhuma bolsa</h2>
          <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
            Quando reservar uma bolsa, ela aparecerá aqui com todas as etapas até a matrícula.
          </p>
          <Button asChild>
            <Link to="/bolsas"><Search className="h-4 w-4 mr-1" /> Buscar bolsas</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const meta = STATUS[r.status] ?? STATUS.RESERVED;
            const Icon = meta.icon;
            const course = r.scholarship?.course_offering?.course;
            const inst = course?.institution;
            const price = Number(r.locked_price ?? r.scholarship?.price_with_scholarship ?? 0);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{inst?.trade_name}</div>
                    <h3 className="font-display font-bold text-lg truncate">{course?.name ?? "Bolsa"}</h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge className={meta.tone + " border-0"}>
                        <Icon className="h-3 w-3 mr-1" /> {meta.label}
                      </Badge>
                      {r.expires_at && (
                        <span className="text-xs text-muted-foreground">
                          Reserva válida até {new Date(r.expires_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Mensalidade</div>
                    <div className="font-display text-xl font-extrabold text-primary">{formatBRL(price)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
