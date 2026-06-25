import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    // supabase auto-parses the recovery token from URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasRecoverySession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada!");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero text-hero-foreground px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card text-card-foreground border border-border shadow-[var(--shadow-elegant)] p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h1 className="font-display text-xl font-extrabold">Nova senha</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Defina uma nova senha para sua conta.
        </p>

        {!hasRecoverySession ? (
          <div className="rounded-xl bg-warning/15 text-warning-foreground p-4 text-sm">
            Abra esta página pelo link enviado no seu e-mail de recuperação.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field id="pwd" label="Nova senha" value={password} onChange={setPassword} />
            <Field id="pwd-c" label="Confirmar senha" value={confirm} onChange={setConfirm} />
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="password"
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
          placeholder="••••••••"
        />
      </div>
    </div>
  );
}
