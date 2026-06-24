import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financeiro/receitas")({
  component: RevenueList,
});

type Row = {
  id: string;
  amount: number;
  method: string;
  status: string;
  gateway_ref: string | null;
  paid_at: string | null;
  reservation_id: string;
  reservations: {
    reservation_code: string;
    user_id: string;
    institution_id: string;
    profiles: { name: string | null; email: string | null } | null;
    institutions: { trade_name: string } | null;
  } | null;
};

function RevenueList() {
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_attempts")
        .select(`id, amount, method, status, gateway_ref, paid_at, reservation_id,
          reservations:reservation_id (
            reservation_code, user_id, institution_id,
            profiles:user_id (name, email),
            institutions:institution_id (trade_name)
          )`)
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = (data ?? []).filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      r.reservations?.reservation_code?.toLowerCase().includes(t) ||
      r.reservations?.profiles?.name?.toLowerCase().includes(t) ||
      r.reservations?.profiles?.email?.toLowerCase().includes(t) ||
      r.reservations?.institutions?.trade_name?.toLowerCase().includes(t) ||
      r.gateway_ref?.toLowerCase().includes(t)
    );
  });

  function exportCsv() {
    const header = ["Data", "Código", "Aluno", "Email", "Instituição", "Método", "Status", "Valor", "Ref. gateway"];
    const lines = rows.map((r) => [
      r.paid_at ? new Date(r.paid_at).toLocaleString("pt-BR") : "",
      r.reservations?.reservation_code ?? "",
      r.reservations?.profiles?.name ?? "",
      r.reservations?.profiles?.email ?? "",
      r.reservations?.institutions?.trade_name ?? "",
      r.method,
      r.status,
      String(r.amount),
      r.gateway_ref ?? "",
    ]);
    const csv = [header, ...lines].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receitas-todebolsa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por código, aluno, instituição…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Aluno</th>
                <th className="text-left px-4 py-3">Instituição</th>
                <th className="text-left px-4 py-3">Método</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum pagamento encontrado.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.reservations?.reservation_code ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.reservations?.profiles?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.reservations?.profiles?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">{r.reservations?.institutions?.trade_name ?? "—"}</td>
                  <td className="px-4 py-3">{r.method}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "PAID" ? "default" : r.status === "REFUNDED" ? "secondary" : "outline"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatBRL(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
