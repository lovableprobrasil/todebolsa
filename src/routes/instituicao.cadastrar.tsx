import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { isValidCNPJ, maskCNPJ, maskCPF, maskPhone, maskCEP, onlyDigits } from "@/lib/validators/cnpj";
import { lookupCep } from "@/lib/validators/cep";

export const Route = createFileRoute("/instituicao/cadastrar")({
  head: () => ({
    meta: [
      { title: "Cadastrar instituição | Tô de Bolsa" },
      { name: "description", content: "Cadastre sua instituição em poucos minutos e envie para análise da equipe Tô de Bolsa." },
    ],
  }),
  component: ApplicationWizardPage,
});

type FormState = {
  trade_name: string; legal_name: string; cnpj: string; institution_type: string;
  website: string; instagram: string; phone: string; email: string;
  responsible_name: string; responsible_role: string; responsible_cpf: string;
  responsible_email: string; responsible_whatsapp: string; authorization_declared: boolean;
  zip: string; address: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; service_mode: string;
  courses_offered: string; levels: string[]; modalities: string[];
  has_idle_vacancies: boolean | null; avg_discount_pct: string; monthly_vacancies: string;
  accepted_terms: boolean; accepted_privacy: boolean;
  accepted_truthfulness: boolean; accepted_representation: boolean;
  // Account creation
  account_name: string; account_email: string; account_email2: string; account_password: string; account_password2: string;
};

const EMPTY: FormState = {
  trade_name: "", legal_name: "", cnpj: "", institution_type: "",
  website: "", instagram: "", phone: "", email: "",
  responsible_name: "", responsible_role: "", responsible_cpf: "",
  responsible_email: "", responsible_whatsapp: "", authorization_declared: false,
  zip: "", address: "", number: "", complement: "",
  neighborhood: "", city: "", state: "", service_mode: "",
  courses_offered: "", levels: [], modalities: [],
  has_idle_vacancies: null, avg_discount_pct: "", monthly_vacancies: "",
  accepted_terms: false, accepted_privacy: false,
  accepted_truthfulness: false, accepted_representation: false,
  account_name: "", account_email: "", account_email2: "", account_password: "", account_password2: "",
};

const TYPE_OPTIONS = [
  "Escola", "Faculdade", "Curso técnico", "Idiomas", "EJA",
  "Pós-graduação", "MBA", "Cursos livres", "Profissionalizante", "Outro",
];
const LEVEL_OPTIONS = ["Educação infantil", "Fundamental", "Médio", "Técnico", "Graduação", "Pós/MBA", "Livre/Idiomas"];
const MODALITY_OPTIONS = ["Presencial", "EAD", "Híbrido", "Semipresencial"];
const SERVICE_MODES = [
  { v: "PRESENCIAL", l: "Presencial" },
  { v: "EAD", l: "EAD" },
  { v: "HIBRIDO", l: "Híbrido" },
  { v: "POLOS", l: "Polos parceiros" },
];

const STORAGE_KEY = "tdb_institution_application_draft";

function ApplicationWizardPage() {
  const navigate = useNavigate();
  const { user, refreshRoles } = useAuth();
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") return EMPTY;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch { return EMPTY; }
  });
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    const base = ["Dados da instituição", "Responsável", "Endereço", "Oferta educacional", "Aceites"];
    return user ? [...base, "Envio"] : [...base, "Criar conta", "Envio"];
  }, [user]);

  // Pre-fill account email from institution responsible email
  useEffect(() => {
    if (!user && !form.account_email && form.responsible_email) {
      setForm((f) => ({ ...f, account_email: f.account_email || f.responsible_email, account_name: f.account_name || f.responsible_name }));
    }
  }, [form.responsible_email, form.responsible_name, user]); // eslint-disable-line

  // Persist draft locally
  useEffect(() => {
    try {
      const { account_password, account_password2, ...safe } = form;
      void account_password; void account_password2;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {/* ignore */}
  }, [form]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function fillCep() {
    const d = onlyDigits(form.zip);
    if (d.length !== 8) return;
    const addr = await lookupCep(form.zip);
    if (!addr) { toast.error("CEP não encontrado."); return; }
    setForm((f) => ({
      ...f,
      address: addr.logradouro || f.address,
      neighborhood: addr.bairro || f.neighborhood,
      city: addr.localidade || f.city,
      state: addr.uf || f.state,
    }));
  }

  const stepValid = useMemo(() => validateStep(step, form, !!user), [step, form, user]);
  const isLastStep = step === steps.length - 1;

  const submitMut = useMutation({
    mutationFn: async () => {
      // 1) sign up if needed
      if (!user) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: form.account_email.trim(),
          password: form.account_password,
          options: {
            emailRedirectTo: `${window.location.origin}/instituicao/credenciamento`,
            data: { name: form.account_name.trim() },
          },
        });
        if (signUpErr) throw new Error(signUpErr.message);
        // Try to ensure a session (if auto-confirm disabled, signIn will fail and we ask user to confirm e-mail)
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: form.account_email.trim(),
          password: form.account_password,
        });
        if (!signInData?.session) {
          throw new Error("Conta criada! Confirme seu e-mail para finalizar o cadastro.");
        }
        await refreshRoles();
      }

      // 2) start application
      const { data: appId, error: startErr } = await supabase.rpc("start_institution_application");
      if (startErr) throw new Error(startErr.message);

      // 3) save payload
      const { error: saveErr } = await supabase.rpc("save_institution_application", {
        p_id: appId as string, p_payload: buildPayload(form),
      });
      if (saveErr) throw new Error(saveErr.message);

      // 4) submit
      const { error: submitErr } = await supabase.rpc("submit_institution_application", { p_id: appId as string });
      if (submitErr) throw new Error(submitErr.message);
    },
    onSuccess: () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {/* */}
      toast.success("Cadastro enviado para análise!");
      navigate({ to: "/instituicao/credenciamento" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accountStepIndex = user ? -1 : steps.length - 2;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Link to="/para-instituicoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>

          <header>
            <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" /> Credenciamento de instituição
            </h1>
            <p className="text-muted-foreground mt-1">
              Etapa {step + 1} de {steps.length} — {steps[step]}
            </p>
          </header>

          <ProgressBar steps={steps} step={step} />

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            {step === 0 && <StepIdentificacao form={form} update={update} />}
            {step === 1 && <StepResponsavel form={form} update={update} />}
            {step === 2 && <StepEndereco form={form} update={update} fillCep={fillCep} />}
            {step === 3 && <StepOferta form={form} update={update} />}
            {step === 4 && <StepAceites form={form} update={update} />}
            {step === accountStepIndex && <StepConta form={form} update={update} />}
            {isLastStep && <StepEnvio form={form} hasUser={!!user} />}
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitMut.isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            {!isLastStep ? (
              <Button
                onClick={() => stepValid ? setStep((s) => s + 1) : toast.error("Preencha os campos obrigatórios.")}
                disabled={!stepValid}
              >
                Próxima etapa <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending} className="gap-2">
                {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Enviar para análise
              </Button>
            )}
          </div>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              Já tem conta? <Link to="/auth" className="underline">Entrar</Link> para continuar um cadastro existente.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProgressBar({ steps, step }: { steps: string[]; step: number }) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-col gap-1.5">
            <div className={
              "h-1.5 rounded-full transition-colors " +
              (done ? "bg-primary" : active ? "bg-primary/60" : "bg-muted")
            } />
            <span className={"text-[10px] sm:text-xs font-medium leading-tight " + (active ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepIdentificacao({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const cnpjOk = !form.cnpj || isValidCNPJ(form.cnpj);
  return (
    <Grid>
      <Field label="Nome fantasia *"><Input value={form.trade_name} onChange={(e) => update("trade_name", e.target.value)} /></Field>
      <Field label="Razão social"><Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} /></Field>
      <Field label="CNPJ *">
        <Input value={form.cnpj} onChange={(e) => update("cnpj", maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
        {!cnpjOk && <p className="text-xs text-destructive mt-1">CNPJ inválido</p>}
      </Field>
      <Field label="Tipo de instituição *">
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={form.institution_type} onChange={(e) => update("institution_type", e.target.value)}>
          <option value="">Selecione...</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Site"><Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" /></Field>
      <Field label="Instagram"><Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@instituicao" /></Field>
      <Field label="Telefone institucional"><Input value={form.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} /></Field>
      <Field label="E-mail institucional"><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
    </Grid>
  );
}

function StepResponsavel({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <Grid>
      <Field label="Nome completo *"><Input value={form.responsible_name} onChange={(e) => update("responsible_name", e.target.value)} /></Field>
      <Field label="Cargo / função *"><Input value={form.responsible_role} onChange={(e) => update("responsible_role", e.target.value)} placeholder="Ex.: Diretor" /></Field>
      <Field label="CPF"><Input value={form.responsible_cpf} onChange={(e) => update("responsible_cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" /></Field>
      <Field label="E-mail *"><Input type="email" value={form.responsible_email} onChange={(e) => update("responsible_email", e.target.value)} /></Field>
      <Field label="WhatsApp *" full><Input value={form.responsible_whatsapp} onChange={(e) => update("responsible_whatsapp", maskPhone(e.target.value))} placeholder="(11) 99999-9999" /></Field>
      <div className="sm:col-span-2 flex items-start gap-2">
        <Checkbox id="auth" checked={form.authorization_declared} onCheckedChange={(c) => update("authorization_declared", !!c)} />
        <Label htmlFor="auth" className="text-sm font-normal leading-snug">
          Declaro que tenho autorização para representar esta instituição perante o Tô de Bolsa.
        </Label>
      </div>
    </Grid>
  );
}

function StepEndereco({ form, update, fillCep }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void; fillCep: () => void }) {
  return (
    <Grid>
      <Field label="CEP *">
        <div className="flex gap-2">
          <Input value={form.zip} onChange={(e) => update("zip", maskCEP(e.target.value))} onBlur={fillCep} placeholder="00000-000" />
          <Button type="button" variant="outline" onClick={fillCep}>Buscar</Button>
        </div>
      </Field>
      <Field label="Endereço *"><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
      <Field label="Número *"><Input value={form.number} onChange={(e) => update("number", e.target.value)} /></Field>
      <Field label="Complemento"><Input value={form.complement} onChange={(e) => update("complement", e.target.value)} /></Field>
      <Field label="Bairro *"><Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></Field>
      <Field label="Cidade *"><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></Field>
      <Field label="UF *"><Input maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} /></Field>
      <Field label="Modalidade de atendimento *">
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={form.service_mode} onChange={(e) => update("service_mode", e.target.value)}>
          <option value="">Selecione...</option>
          {SERVICE_MODES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </Field>
    </Grid>
  );
}

function StepOferta({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const toggle = (k: "levels" | "modalities", v: string) => {
    const cur = form[k];
    update(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  return (
    <div className="space-y-5">
      <Field label="Quais cursos oferece? *" full>
        <Textarea rows={3} value={form.courses_offered} onChange={(e) => update("courses_offered", e.target.value)}
          placeholder="Separe por vírgula. Ex.: Administração, Direito, Inglês básico..." />
      </Field>
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Níveis de ensino *</Label>
        <div className="flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map((l) => (
            <button type="button" key={l} onClick={() => toggle("levels", l)}
              className={"px-3 h-9 rounded-xl text-xs font-bold " + (form.levels.includes(l) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Modalidades *</Label>
        <div className="flex flex-wrap gap-2">
          {MODALITY_OPTIONS.map((m) => (
            <button type="button" key={m} onClick={() => toggle("modalities", m)}
              className={"px-3 h-9 rounded-xl text-xs font-bold " + (form.modalities.includes(m) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70")}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <Grid>
        <Field label="Possui vagas ociosas? *">
          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={form.has_idle_vacancies === null ? "" : form.has_idle_vacancies ? "yes" : "no"}
            onChange={(e) => update("has_idle_vacancies", e.target.value === "" ? null : e.target.value === "yes")}>
            <option value="">Selecione...</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
          </select>
        </Field>
        <Field label="Desconto médio pretendido (%)">
          <Input type="number" min={0} max={100} value={form.avg_discount_pct} onChange={(e) => update("avg_discount_pct", e.target.value)} />
        </Field>
        <Field label="Vagas aproximadas / mês" full>
          <Input type="number" min={0} value={form.monthly_vacancies} onChange={(e) => update("monthly_vacancies", e.target.value)} />
        </Field>
      </Grid>
    </div>
  );
}

function StepAceites({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const items: Array<[keyof FormState, React.ReactNode]> = [
    ["accepted_terms", <>Li e aceito os <Link to="/termos" className="underline">Termos de Uso</Link>.</>],
    ["accepted_privacy", <>Li e aceito a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</>],
    ["accepted_truthfulness", <>Declaro que todas as informações fornecidas são verdadeiras.</>],
    ["accepted_representation", <>Confirmo que tenho autorização para representar a instituição.</>],
  ];
  return (
    <div className="space-y-4">
      {items.map(([k, label]) => (
        <label key={k as string} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-secondary/40">
          <Checkbox checked={!!form[k]} onCheckedChange={(c) => update(k, !!c as never)} />
          <span className="text-sm leading-snug">{label}</span>
        </label>
      ))}
    </div>
  );
}

function StepConta({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const pwMatch = !form.account_password2 || form.account_password === form.account_password2;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Crie sua conta para acompanhar a análise, conversar com o time e gerenciar sua instituição depois de aprovado.
      </p>
      <Grid>
        <Field label="Seu nome *" full><Input value={form.account_name} onChange={(e) => update("account_name", e.target.value)} /></Field>
        <Field label="E-mail de acesso *" full>
          <Input type="email" value={form.account_email} onChange={(e) => update("account_email", e.target.value)} />
        </Field>
        <Field label="Senha *">
          <Input type="password" value={form.account_password} onChange={(e) => update("account_password", e.target.value)} placeholder="Mínimo 6 caracteres" />
        </Field>
        <Field label="Confirmar senha *">
          <Input type="password" value={form.account_password2} onChange={(e) => update("account_password2", e.target.value)} />
          {!pwMatch && <p className="text-xs text-destructive mt-1">As senhas não coincidem.</p>}
        </Field>
      </Grid>
    </div>
  );
}

function StepEnvio({ form, hasUser }: { form: FormState; hasUser: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Tudo pronto para enviar</h2>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• Instituição: <span className="text-foreground font-medium">{form.trade_name || "—"}</span></li>
        <li>• CNPJ: <span className="text-foreground font-medium">{form.cnpj || "—"}</span></li>
        <li>• Responsável: <span className="text-foreground font-medium">{form.responsible_name || "—"}</span></li>
        <li>• Cidade/UF: <span className="text-foreground font-medium">{form.city ? `${form.city}/${form.state}` : "—"}</span></li>
        {!hasUser && <li>• Conta: <span className="text-foreground font-medium">{form.account_email}</span></li>}
      </ul>
      <p className="text-xs text-muted-foreground">
        Ao enviar, sua instituição entra na fila de análise. Você receberá um aviso assim que o time concluir a revisão.
      </p>
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

function buildPayload(f: FormState) {
  return {
    trade_name: f.trade_name || null,
    legal_name: f.legal_name || null,
    cnpj: f.cnpj ? onlyDigits(f.cnpj) : null,
    institution_type: f.institution_type || null,
    website: f.website || null,
    instagram: f.instagram || null,
    phone: f.phone || null,
    email: f.email || null,
    responsible_name: f.responsible_name || null,
    responsible_role: f.responsible_role || null,
    responsible_cpf: f.responsible_cpf ? onlyDigits(f.responsible_cpf) : null,
    responsible_email: f.responsible_email || null,
    responsible_whatsapp: f.responsible_whatsapp || null,
    authorization_declared: f.authorization_declared,
    zip: f.zip ? onlyDigits(f.zip) : null,
    address: f.address || null,
    number: f.number || null,
    complement: f.complement || null,
    neighborhood: f.neighborhood || null,
    city: f.city || null,
    state: f.state ? f.state.toUpperCase().slice(0, 2) : null,
    service_mode: f.service_mode || null,
    courses_offered: f.courses_offered
      ? f.courses_offered.split(",").map((s) => s.trim()).filter(Boolean) : [],
    levels: f.levels,
    modalities: f.modalities,
    has_idle_vacancies: f.has_idle_vacancies,
    avg_discount_pct: f.avg_discount_pct ? parseInt(f.avg_discount_pct, 10) : null,
    monthly_vacancies: f.monthly_vacancies ? parseInt(f.monthly_vacancies, 10) : null,
    accepted_terms: f.accepted_terms,
    accepted_privacy: f.accepted_privacy,
    accepted_truthfulness: f.accepted_truthfulness,
    accepted_representation: f.accepted_representation,
  };
}

function validateStep(step: number, f: FormState, hasUser: boolean): boolean {
  switch (step) {
    case 0:
      return !!f.trade_name && !!f.institution_type && !!f.cnpj && isValidCNPJ(f.cnpj);
    case 1:
      return !!f.responsible_name && !!f.responsible_role && !!f.responsible_email
        && !!f.responsible_whatsapp && f.authorization_declared;
    case 2:
      return onlyDigits(f.zip).length === 8 && !!f.address && !!f.number && !!f.neighborhood
        && !!f.city && f.state.length === 2 && !!f.service_mode;
    case 3:
      return !!f.courses_offered.trim() && f.levels.length > 0 && f.modalities.length > 0
        && f.has_idle_vacancies !== null;
    case 4:
      return f.accepted_terms && f.accepted_privacy && f.accepted_truthfulness && f.accepted_representation;
    case 5:
      if (hasUser) return true; // envio
      return !!f.account_name.trim() && /\S+@\S+\.\S+/.test(f.account_email)
        && f.account_email.trim().toLowerCase() === f.account_email2.trim().toLowerCase()
        && f.account_password.length >= 6 && f.account_password === f.account_password2;
    case 6:
      return true; // envio (sem usuário previamente)
    default:
      return false;
  }
}
