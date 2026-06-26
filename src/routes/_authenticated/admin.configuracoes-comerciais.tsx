import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Loader2, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/configuracoes-comerciais")({
  component: PricingRulesAdmin,
});

type Rule = {
  id: string;
  scope_type: "GLOBAL" | "INSTITUTION" | "COURSE" | "SCHOLARSHIP";
  scope_id: string | null;
  pricing_type: "FIXED_AMOUNT" | "PERCENTAGE_OF_COURSE_VALUE" | "FIRST_MONTHLY_PAYMENT";
  fixed_amount: number | null;
  percentage_rate: number | null;
  minimum_amount: number | null;
  maximum_amount: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const SCOPE_LABEL = {
  GLOBAL: "Global (plataforma)",
  INSTITUTION: "Instituição",
  COURSE: "Curso/Oferta",
  SCHOLARSHIP: "Bolsa específica",
};
const PRICING_LABEL = {
  FIXED_AMOUNT: "Valor fixo",
  PERCENTAGE_OF_COURSE_VALUE: "Percentual sobre o curso",
  FIRST_MONTHLY_PAYMENT: "Primeira mensalidade",
};

function PricingRulesAdmin() {
  const qc = useQueryClient();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_pricing_rules")
        .select("*")
        .order("scope_type", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Rule[];
    },
  });

  const save = useMutation({
    mutationFn: async (r: Partial<Rule> & { id?: string }) => {
      const payload = {
        scope_type: r.scope_type,
        scope_id: r.scope_id || null,
        pricing_type: r.pricing_type,
        fixed_amount: r.pricing_type === "FIXED_AMOUNT" ? Number(r.fixed_amount) : null,
        percentage_rate: r.pricing_type === "PERCENTAGE_OF_COURSE_VALUE" ? Number(r.percentage_rate) : null,
        minimum_amount: r.minimum_amount != null && r.minimum_amount !== ("" as unknown as number) ? Number(r.minimum_amount) : null,
        maximum_amount: r.maximum_amount != null && r.maximum_amount !== ("" as unknown as number) ? Number(r.maximum_amount) : null,
        currency: r.currency || "BRL",
        is_active: r.is_active ?? true,
      };
      if (r.id) {
        const { error } = await (supabase.from as any)("marketplace_pricing_rules").update(payload).eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)("marketplace_pricing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Regra salva."); qc.invalidateQueries({ queryKey: ["pricing-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("marketplace_pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Regra removida."); qc.invalidateQueries({ queryKey: ["pricing-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [draft, setDraft] = useState<Partial<Rule>>({
    scope_type: "GLOBAL", pricing_type: "FIXED_AMOUNT", fixed_amount: 59.9,
    currency: "BRL", is_active: true,
  });

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-extrabold">Parâmetros comerciais</h1>
            <p className="text-sm text-muted-foreground">
              Configure o valor único cobrado do aluno pela <strong>reserva da bolsa</strong> (valor pago ao Tô de Bolsa).
              A hierarquia aplicada é: <em>Bolsa &gt; Curso &gt; Instituição &gt; Global</em>.
            </p>
          </div>
        </div>
      </header>

      {/* Nova regra */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold flex items-center gap-2"><Plus className="h-4 w-4" /> Nova regra</h2>
        <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Escopo">
            <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full"
              value={draft.scope_type}
              onChange={(e) => setDraft({ ...draft, scope_type: e.target.value as Rule["scope_type"] })}>
              {Object.entries(SCOPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {draft.scope_type !== "GLOBAL" && (
            <Field label={`ID do ${SCOPE_LABEL[draft.scope_type as keyof typeof SCOPE_LABEL]}`}>
              <Input value={draft.scope_id ?? ""} onChange={(e) => setDraft({ ...draft, scope_id: e.target.value })}
                placeholder="uuid" />
            </Field>
          )}
          <Field label="Modelo de cobrança">
            <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full"
              value={draft.pricing_type}
              onChange={(e) => setDraft({ ...draft, pricing_type: e.target.value as Rule["pricing_type"] })}>
              {Object.entries(PRICING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {draft.pricing_type === "FIXED_AMOUNT" && (
            <Field label="Valor fixo (R$)">
              <Input type="number" step="0.01" value={draft.fixed_amount ?? ""} onChange={(e) => setDraft({ ...draft, fixed_amount: Number(e.target.value) })} />
            </Field>
          )}
          {draft.pricing_type === "PERCENTAGE_OF_COURSE_VALUE" && (
            <Field label="Percentual (%)">
              <Input type="number" step="0.01" value={draft.percentage_rate ?? ""} onChange={(e) => setDraft({ ...draft, percentage_rate: Number(e.target.value) })} />
            </Field>
          )}
          <Field label="Mínimo (R$)">
            <Input type="number" step="0.01" value={draft.minimum_amount ?? ""} onChange={(e) => setDraft({ ...draft, minimum_amount: e.target.value === "" ? null : Number(e.target.value) })} />
          </Field>
          <Field label="Máximo (R$)">
            <Input type="number" step="0.01" value={draft.maximum_amount ?? ""} onChange={(e) => setDraft({ ...draft, maximum_amount: e.target.value === "" ? null : Number(e.target.value) })} />
          </Field>
          <Field label="Ativa">
            <div className="flex items-center h-10"><Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /></div>
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Criar regra
          </Button>
        </div>
      </section>

      {/* Lista de regras */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-extrabold">Regras vigentes</h2>
        {isLoading ? (
          <div className="h-32 mt-4 rounded-2xl bg-muted animate-pulse" />
        ) : !rules?.length ? (
          <p className="text-sm text-muted-foreground mt-4">Nenhuma regra cadastrada.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Escopo</th>
                  <th className="py-2 pr-3">Modelo</th>
                  <th className="py-2 pr-3">Valor / Taxa</th>
                  <th className="py-2 pr-3">Min/Max</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold">{SCOPE_LABEL[r.scope_type]}</div>
                      {r.scope_id && <div className="text-[11px] text-muted-foreground font-mono">{r.scope_id.slice(0, 8)}…</div>}
                    </td>
                    <td className="py-2.5 pr-3">{PRICING_LABEL[r.pricing_type]}</td>
                    <td className="py-2.5 pr-3 font-bold">
                      {r.pricing_type === "FIXED_AMOUNT" && formatBRL(Number(r.fixed_amount ?? 0))}
                      {r.pricing_type === "PERCENTAGE_OF_COURSE_VALUE" && `${r.percentage_rate}%`}
                      {r.pricing_type === "FIRST_MONTHLY_PAYMENT" && "1ª mensalidade c/ bolsa"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {r.minimum_amount != null ? formatBRL(Number(r.minimum_amount)) : "—"} / {r.maximum_amount != null ? formatBRL(Number(r.maximum_amount)) : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge className={r.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                        {r.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => save.mutate({ ...r, is_active: !r.is_active })}>
                        {r.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remover esta regra?")) del.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
