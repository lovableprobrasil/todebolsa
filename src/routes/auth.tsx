import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/painel", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: redirect ?? "/painel", replace: true });
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

          <Divider />

          <GoogleButton />

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar você concorda com nossos{" "}
            <Link to="/" className="underline">Termos</Link> e{" "}
            <Link to="/" className="underline">Privacidade</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">ou</span>
      <div className="h-px flex-1 bg-border" />
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
        <Input
          id="login-password"
          type="password"
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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/painel`,
        data: { full_name: name },
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
      <Field id="signup-password" label="Senha" icon={Lock}>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
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

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google. Tente novamente.");
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handle}
      disabled={loading}
      className="w-full h-11 gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
      )}
      Continuar com Google
    </Button>
  );
}
