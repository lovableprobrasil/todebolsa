import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/instituicao/cadastrar")({
  component: ClaimInstitutionPage,
});

function ClaimInstitutionPage() {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    trade_name: "",
    legal_name: "",
    cnpj: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    unit_name: "Unidade principal",
    city: "",
    state: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trade_name.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Preencha nome da instituição, cidade e estado.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("claim_institution", {
      p_trade_name: form.trade_name,
      p_legal_name: form.legal_name,
      p_cnpj: form.cnpj,
      p_email: form.email,
      p_phone: form.phone,
      p_website: form.website,
      p_description: form.description,
      p_unit_name: form.unit_name,
      p_city: form.city,
      p_state: form.state.toUpperCase().slice(0, 2),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    toast.success("Solicitação enviada! Sua instituição está em análise.");
    navigate({ to: "/instituicao/$id", params: { id: data as string } });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/instituicao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" /> Cadastrar instituição
        </h1>
        <p className="text-muted-foreground mt-1">
          Preencha os dados. Sua instituição ficará em análise até ser aprovada pela nossa equipe.
        </p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <Section title="Identificação">
          <Grid>
            <Field label="Nome fantasia *" full>
              <Input required value={form.trade_name} onChange={(e) => update("trade_name", e.target.value)} placeholder="Ex.: Faculdade Brasil" />
            </Field>
            <Field label="Razão social">
              <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} />
            </Field>
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
          </Grid>
        </Section>

        <Section title="Contato">
          <Grid>
            <Field label="E-mail institucional">
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </Field>
            <Field label="Website" full>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Descrição curta" full>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Conte em poucas linhas sobre a instituição."
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Unidade principal">
          <Grid>
            <Field label="Nome da unidade" full>
              <Input value={form.unit_name} onChange={(e) => update("unit_name", e.target.value)} />
            </Field>
            <Field label="Cidade *">
              <Input required value={form.city} onChange={(e) => update("city", e.target.value)} />
            </Field>
            <Field label="UF *">
              <Input required maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} placeholder="SP" />
            </Field>
          </Grid>
        </Section>

        <div className="pt-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar para análise
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/instituicao">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
