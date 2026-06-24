import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bookmark, Search, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/reservas")({
  component: AdminReservations,
});

const STATUS: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  RESERVED: { label: "Reservada", tone: "bg-brand-blue-soft text-brand-blue", icon: Clock },
  PAYMENT_PENDING: { label: "Pagto pendente", tone: "bg-warning/15 text-warning-foreground", icon: AlertCircle },
  CONFIRMED: { label: "Confirmada", tone: "bg-primary-soft text-primary", icon: CheckCircle2 },
  AWAITING_ENROLLMENT: { label: "Aguardando matrícula", tone: "bg-brand-blue-soft text-brand-blue", icon: Clock },
  ENROLLMENT_APPROVED: { label: "Matrícula OK", tone: "bg-primary text-primary-foreground", icon: CheckCircle2 },
  ENROLLMENT_REJECTED: { label: "Matrícula recusada", tone: "bg-destructive/15 text-destructive", icon: XCircle },
  EXPIRED: { label: "Expirada", tone: "bg-muted text-muted-foreground", icon: XCircle },
  CANCELLED: { label: "Cancelada", tone: "bg-muted text-muted-foreground", icon: XCircle },
  UNDER_REVIEW: { label: "Em análise", tone: "bg-warning/15 text-warning-foreground", icon: Clock },
};

function AdminReservations() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data: rs, error } = await supabase
        .from("reservations")
        .select(`
          id, user_id, reservation_code, status, payment_status, amount_paid, expires_at, created_at,
          institution:institutions(trade_name),
          scholarship:scholarships(title, course_offering:course_offerings(course:courses(name)))
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((rs ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, name, email").in("id", ids)
        : { data: [] as { id: string; name: string | null; email: string | null }[] };
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return (rs ?? []).map((r) => ({ ...r, user: byId.get(r.user_id) ?? null }));
    },
  });

  const filtered = (data ?? []).filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return r.reservation_code.toLowerCase().includes(t)
      || (r.user?.email ?? "").toLowerCase().includes(t)
      || (r.user?.name ?? "").toLowerCase().includes(t)
      || (r.institution?.trade_name ?? "").toLowerCase().includes(t);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] rounded-xl border border-border bg-background px-3 h-10">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, aluno, instituição..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        {["ALL", "PAYMENT_PENDING", "CONFIRMED", "EXPIRED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 h-9 rounded-xl text-xs font-bold " + (filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-muted")}>
            {s === "ALL" ? "Todas" : (STATUS[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Código</th>
                <th className="text-left px-4 py-2">Aluno</th>
                <th className="text-left px-4 py-2">Instituição / Curso</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Valor</th>
                <th className="text-left px-4 py-2">Criada</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const meta = STATUS[r.status] ?? STATUS.RESERVED;
                const Icon = meta.icon;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{r.reservation_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[180px]">{r.user?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{r.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[220px]">{r.institution?.trade_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {r.scholarship?.course_offering?.course?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={meta.tone + " border-0"}><Icon className="h-3 w-3 mr-1" /> {meta.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatBRL(Number(r.amount_paid ?? 0))}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma reserva encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
