import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/financeiro/instituicoes")({
  component: RevenueByInstitution,
});

type Row = {
  institution_id: string;
  trade_name: string;
  payments_count: number;
  gross: number;
  refunds: number;
  net: number;
};

function RevenueByInstitution() {
  const { data, isLoading } = useQuery({
    queryKey: ["finance-by-institution"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("finance_revenue_by_institution");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Receita do Tô de Bolsa originada por cada instituição parceira. <strong>Nenhum valor é
        repassado</strong> — este relatório serve apenas para gestão comercial interna.
      </p>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Instituição</th>
                <th className="text-right px-4 py-3">Pagamentos</th>
                <th className="text-right px-4 py-3">Receita bruta</th>
                <th className="text-right px-4 py-3">Reembolsos</th>
                <th className="text-right px-4 py-3">Receita líquida</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && (data ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma receita registrada.</td></tr>
              )}
              {(data ?? []).map((r) => (
                <tr key={r.institution_id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.trade_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.payments_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.gross)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-600">
                    {Number(r.refunds) > 0 ? `−${formatBRL(r.refunds)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-success">{formatBRL(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
