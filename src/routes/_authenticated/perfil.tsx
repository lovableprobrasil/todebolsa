import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserCircle, Loader2, Save, Gift, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isValidCPF, maskCPF, onlyDigits } from "@/lib/validators/cnpj";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
    if (user?.id) {
      supabase.from("profiles").select("cpf").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data?.cpf) setCpf(data.cpf);
      });
    }
  }, [profile, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (cpf && !isValidCPF(cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone: phone || null, cpf: cpf ? onlyDigits(cpf) : null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Perfil atualizado!");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <UserCircle className="h-7 w-7 text-primary" /> Meu perfil
        </h1>
        <p className="text-muted-foreground mt-1">Mantenha seus dados atualizados para reservar bolsas.</p>
      </header>

      <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Row label="E-mail">
          <Input value={user?.email ?? ""} disabled />
        </Row>
        <Row label="Nome completo">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Row>
        <Row label="Telefone (WhatsApp)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        </Row>
        <Row label="CPF">
          <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
        </Row>
        <div className="pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          to="/indicacoes"
          className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:-translate-y-0.5 transition-all flex items-center gap-3"
        >
          <Gift className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-bold">Indique e ganhe R$ 25</div>
            <div className="text-xs text-muted-foreground">Crédito + PIX a partir de R$ 25</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/meus-dados"
          className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:-translate-y-0.5 transition-all flex items-center gap-3"
        >
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-bold">Privacidade e dados</div>
            <div className="text-xs text-muted-foreground">LGPD: exportar ou excluir</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
