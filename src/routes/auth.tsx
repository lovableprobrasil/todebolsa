import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type AuthSearch = { redirect?: string; tab?: "login" | "signup" };

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (raw: Record<string, unknown>): AuthSearch => ({
    redirect: str(raw.redirect),
    tab: raw.tab === "signup" ? "signup" : raw.tab === "login" ? "login" : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, tab } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    async function routeAfterAuth(userId: string) {
      if (redirect) { navigate({ to: redirect, replace: true }); return; }
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "PLATFORM_ADMIN")
        .maybeSingle();
      navigate({ to: adminRole ? "/admin" : "/painel", replace: true });
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterAuth(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) routeAfterAuth(s.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  return (
    <div className="min-h-screen flex flex-col bg-hero text-hero-foreground">
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-brand-blue/40 blur-3xl" />
      </div>

      <header className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Tô de <span className="text-primary">Bolsa</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-card text-card-foreground border border-border shadow-[var(--shadow-elegant)] p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-extrabold">Bem-vindo(a)!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entre ou crie sua conta para garantir sua bolsa.
            </p>
          </div>

          <Tabs defaultValue={tab ?? "login"} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar você concorda com nossos{" "}
            <Link to="/termos" className="underline">Termos</Link> e{" "}
            <Link to="/privacidade" className="underline">Privacidade</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="login-email" label="E-mail" icon={Mail}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="pl-9"
        />
      </Field>
      <Field id="login-password" label="Senha" icon={Lock}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="pl-9"
        />
      </Field>
      <div className="text-right">
        <Link to="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      toast.error("Os e-mails não conferem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/painel`,
        data: { full_name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already")
          ? "Este e-mail já está cadastrado. Faça login."
          : error.message,
      );
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail se solicitado.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="signup-name" label="Nome completo" icon={UserIcon}>
        <Input
          id="signup-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maria Silva"
          className="pl-9"
        />
      </Field>
      <Field id="signup-email" label="E-mail" icon={Mail}>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="pl-9"
        />
      </Field>
      <Field id="signup-email-confirm" label="Confirmar e-mail" icon={Mail}>
        <Input
          id="signup-email-confirm"
          type="email"
          autoComplete="email"
          required
          value={emailConfirm}
          onChange={(e) => setEmailConfirm(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          placeholder="Repita o e-mail"
          className="pl-9"
        />
      </Field>
      <Field id="signup-password" label="Senha" icon={Lock}>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="pl-9"
        />
      </Field>
      <Field id="signup-password-confirm" label="Confirmar senha" icon={Lock}>
        <PasswordInput
          id="signup-password-confirm"
          autoComplete="new-password"
          required
          minLength={6}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="Repita a senha"
          className="pl-9"
        />
      </Field>
      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar minha conta"}
      </Button>
    </form>
  );
}

function Field({
  id, label, icon: Icon, children,
}: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

