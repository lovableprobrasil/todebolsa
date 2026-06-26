import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Check, ChevronRight, ShieldCheck, GraduationCap,
  CreditCard, QrCode, FileText, ArrowLeft, Lock, Mail, User as UserIcon, Phone, MapPin, IdCard,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { lookupCep } from "@/lib/validators/cep";
import { isValidCPF, maskCPF } from "@/lib/validators/cnpj";
const formatCPF = maskCPF;
import { trackEvent } from "@/lib/analytics";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StripeScholarshipCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

type Step = 1 | 2 | 3 | 4;

type Personal = {
  name: string; cpf: string; phone: string; whatsapp: string;
  email: string; emailConfirm: string; password: string; passwordConfirm: string;
};
type Address = {
  cep: string; street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string;
};
type Acceptances = {
  terms: boolean; privacy: boolean; conditions: boolean; contract: boolean;
};

const TOKEN_KEY_PREFIX = "tdb_checkout_token_";
const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/checkout/$scholarshipId")({
  ssr: false,
  component: CheckoutPage,
});

function CheckoutPage() {
  const { scholarshipId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [personal, setPersonal] = useState<Personal>({
    name: "", cpf: "", phone: "", whatsapp: "", email: "",
    emailConfirm: "", password: "", passwordConfirm: "",
  });
  const [address, setAddress] = useState<Address>({
    cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [acceptances, setAcceptances] = useState<Acceptances>({
    terms: false, privacy: false, conditions: false, contract: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "BOLETO" | "CARD">("PIX");
  const [installments, setInstallments] = useState(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Load scholarship
  const { data: scholarship, isLoading: loadingSch } = useQuery({
    queryKey: ["checkout-scholarship", scholarshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select(`
          id, title, discount_type, discount_value, price_with_scholarship,
          end_at, max_uses, used_count, rules, required_documents,
          course_offerings!inner(
            id, vacancies_available,
            courses!inner(id, name, level, modality, shift, original_price, institutions!inner(id, name, trade_name, logo_url, slug))
          )
        `)
        .eq("id", scholarshipId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Start checkout session
  useEffect(() => {
    if (sessionToken) return;
    const storageKey = TOKEN_KEY_PREFIX + scholarshipId;
    const existing = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    (async () => {
      const { data, error } = await supabase.rpc("checkout_start", {
        p_scholarship_id: scholarshipId,
        p_session_token: existing ?? undefined,
      } as any);
      if (error) { toast.error("Não foi possível iniciar o checkout"); return; }
      const session = data as any;
      setSessionToken(session.session_token);
      setSessionId(session.id);
      if (typeof window !== "undefined") localStorage.setItem(storageKey, session.session_token);
      if (session.personal_data && Object.keys(session.personal_data).length) {
        setPersonal((p) => ({ ...p, ...session.personal_data, password: "", passwordConfirm: "" }));
      }
      if (session.address_data && Object.keys(session.address_data).length) {
        setAddress((a) => ({ ...a, ...session.address_data }));
      }
      if (session.current_step === "SCHOLARSHIP") setStep(2);
      else if (session.current_step === "REVIEW") setStep(3);
      else if (session.current_step === "PAYMENT") setStep(4);
      trackEvent("checkout_view", { entityType: "scholarship", entityId: scholarshipId });
    })();
  }, [scholarshipId, sessionToken]);

  // Prefill from logged-in user
  useEffect(() => {
    if (!user) return;
    setPersonal((p) => ({
      ...p,
      email: p.email || user.email || "",
      emailConfirm: p.emailConfirm || user.email || "",
      name: p.name || (user.user_metadata as any)?.full_name || "",
    }));
  }, [user]);

  const inst = (scholarship as any)?.course_offerings?.courses?.institutions;
  const course = (scholarship as any)?.course_offerings?.courses;
  const originalPrice = Number(course?.original_price ?? 0);
  const scholarshipPrice = Number((scholarship as any)?.price_with_scholarship ?? 0);
  const discountPct = originalPrice > 0
    ? Math.round((1 - scholarshipPrice / originalPrice) * 100)
    : 0;
  const checkoutFee = 59.90; // pulled from pricing_rule (already snapshotted in session)

  const saveStep = async (nextStep: Step) => {
    if (!sessionToken) return;
    const stepMap: Record<Step, string> = { 1: "DATA", 2: "SCHOLARSHIP", 3: "REVIEW", 4: "PAYMENT" };
    await supabase.rpc("checkout_save_step", {
      p_session_token: sessionToken,
      p_step: stepMap[nextStep] as any,
      p_personal: cleanPersonal(personal) as any,
      p_address: address as any,
      p_payment_method: paymentMethod as any,
      p_installments: installments,
    } as any);
  };

  if (loadingSch) {
    return <div className="min-h-screen grid place-content-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!scholarship) {
    return <div className="min-h-screen grid place-content-center"><p>Bolsa não encontrada.</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-display font-bold">Tô de <span className="text-primary">Bolsa</span></span>
          </Link>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Compra 100% segura
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Stepper step={step} />

        <div className="grid lg:grid-cols-[1fr,360px] gap-6 mt-6">
          <div>
            {step === 1 && (
              <StepData
                personal={personal} setPersonal={setPersonal}
                address={address} setAddress={setAddress}
                isLogged={!!user}
                onCheckExisting={async (email, cpf) => {
                  if (user) return;
                  const { data } = await supabase.rpc("checkout_check_existing_account", {
                    p_email: email || undefined, p_cpf: cpf || undefined,
                  } as any);
                  if ((data as any)?.exists) setShowLoginPrompt(true);
                }}
                onContinue={async () => {
                  const err = validatePersonal(personal, !!user) || validateAddress(address);
                  if (err) { toast.error(err); return; }
                  await saveStep(2);
                  trackEvent("checkout_step_data", { entityType: "scholarship", entityId: scholarshipId });
                  setStep(2);
                }}
              />
            )}
            {step === 2 && scholarship && (
              <StepScholarship
                scholarship={scholarship as any} course={course} institution={inst}
                originalPrice={originalPrice} scholarshipPrice={scholarshipPrice} discountPct={discountPct} checkoutFee={checkoutFee}
                acceptances={acceptances} setAcceptances={setAcceptances}
                onBack={() => setStep(1)}
                onContinue={async () => {
                  if (!acceptances.terms || !acceptances.privacy || !acceptances.conditions || !acceptances.contract) {
                    toast.error("Marque todos os aceites obrigatórios"); return;
                  }
                  await saveStep(3);
                  if (sessionToken) {
                    await supabase.rpc("checkout_record_acceptances", {
                      p_session_token: sessionToken,
                      p_terms: ["TERMS", "PRIVACY", "SCHOLARSHIP_CONDITIONS", "CONTRACT"],
                    } as any);
                  }
                  trackEvent("checkout_step_terms", { entityType: "scholarship", entityId: scholarshipId });
                  setStep(3);
                }}
              />
            )}
            {step === 3 && (
              <StepReview
                personal={personal} address={address}
                course={course} institution={inst} checkoutFee={checkoutFee}
                onEditData={() => setStep(1)} onEditScholarship={() => setStep(2)}
                onContinue={async () => { await saveStep(4); setStep(4); }}
              />
            )}
            {step === 4 && sessionToken && (
              <StepStripePayment
                sessionToken={sessionToken}
                account={{
                  name: personal.name.trim(),
                  email: personal.email.trim().toLowerCase(),
                  password: user ? undefined : personal.password,
                  cpf: personal.cpf,
                  phone: personal.whatsapp || personal.phone,
                }}
                checkoutFee={checkoutFee}
                onBack={() => setStep(3)}
              />
            )}

          </div>

          <aside className="space-y-4">
            <SummaryCard
              institution={inst} course={course}
              originalPrice={originalPrice} scholarshipPrice={scholarshipPrice}
              discountPct={discountPct} checkoutFee={checkoutFee}
            />
          </aside>
        </div>
      </div>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conta já existe</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Identificamos que você já possui conta. Faça login para continuar sua compra.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancelar</Button>
            <Button onClick={() => navigate({
              to: "/auth",
              search: { redirect: `/checkout/${scholarshipId}` },
            })}>Entrar e continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------- helpers --------
function cleanPersonal(p: Personal) {
  const { password: _p, passwordConfirm: _pc, ...rest } = p;
  return rest;
}
function validatePersonal(p: Personal, isLogged: boolean): string | null {
  if (p.name.trim().split(/\s+/).length < 2) return "Informe seu nome completo";
  if (p.cpf && !isValidCPF(p.cpf)) return "CPF inválido";
  if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(p.phone.replace(/\s/g, ""))) return "Telefone inválido";
  if (!/^\S+@\S+\.\S+$/.test(p.email)) return "E-mail inválido";
  if (p.email.toLowerCase() !== p.emailConfirm.toLowerCase()) return "Os e-mails não conferem";
  if (!isLogged) {
    if (p.password.length < 6) return "Senha precisa de pelo menos 6 caracteres";
    if (p.password !== p.passwordConfirm) return "As senhas não conferem";
  }
  return null;
}
function validateAddress(a: Address): string | null {
  if (a.cep.replace(/\D/g, "").length !== 8) return "CEP inválido";
  if (!a.street.trim()) return "Logradouro é obrigatório";
  if (!a.number.trim()) return "Número é obrigatório";
  if (!a.city.trim() || !a.state.trim()) return "Cidade e estado são obrigatórios";
  return null;
}

// -------- components --------
function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Dados" },
    { n: 2, label: "Bolsa" },
    { n: 3, label: "Revisão" },
    { n: 4, label: "Pagamento" },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 flex-1">
          <div className={`h-8 w-8 rounded-full grid place-content-center text-sm font-bold ${
            step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > s.n ? <Check className="h-4 w-4" /> : s.n}
          </div>
          <span className={`text-sm ${step >= s.n ? "font-medium" : "text-muted-foreground"}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`h-px flex-1 ${step > s.n ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function StepData(props: {
  personal: Personal; setPersonal: (p: Personal) => void;
  address: Address; setAddress: (a: Address) => void;
  isLogged: boolean;
  onCheckExisting: (email: string, cpf: string) => void;
  onContinue: () => void;
}) {
  const { personal, setPersonal, address, setAddress, isLogged, onCheckExisting, onContinue } = props;
  const [cepLoading, setCepLoading] = useState(false);

  const onCepBlur = async () => {
    const d = address.cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    setCepLoading(true);
    const r = await lookupCep(d);
    setCepLoading(false);
    if (r) {
      setAddress({
        ...address,
        street: r.logradouro || address.street,
        neighborhood: r.bairro || address.neighborhood,
        city: r.localidade || address.city,
        state: r.uf || address.state,
      });
    }
  };

  return (
    <Card><CardContent className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Seus dados</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome completo" icon={UserIcon}>
          <Input value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} className="pl-9" />
        </Field>
        <Field label="CPF" icon={IdCard}>
          <Input value={personal.cpf} onChange={(e) => setPersonal({ ...personal, cpf: formatCPF(e.target.value) })} maxLength={14} className="pl-9"
            onBlur={() => onCheckExisting("", personal.cpf)} />
        </Field>
        <Field label="Telefone" icon={Phone}>
          <Input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} className="pl-9" placeholder="(11) 99999-9999" />
        </Field>
        <Field label="WhatsApp" icon={Phone}>
          <Input value={personal.whatsapp} onChange={(e) => setPersonal({ ...personal, whatsapp: e.target.value })} className="pl-9" placeholder="(11) 99999-9999" />
        </Field>
        <Field label="E-mail" icon={Mail}>
          <Input type="email" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
            onBlur={() => onCheckExisting(personal.email, "")} className="pl-9" disabled={isLogged} />
        </Field>
        <Field label="Confirmar e-mail" icon={Mail}>
          <Input type="email" value={personal.emailConfirm} onChange={(e) => setPersonal({ ...personal, emailConfirm: e.target.value })}
            onPaste={(e) => e.preventDefault()} className="pl-9" disabled={isLogged} />
        </Field>
        {!isLogged && (
          <>
            <Field label="Senha" icon={Lock}>
              <PasswordInput value={personal.password} onChange={(e) => setPersonal({ ...personal, password: e.target.value })} className="pl-9" />
            </Field>
            <Field label="Confirmar senha" icon={Lock}>
              <PasswordInput value={personal.passwordConfirm} onChange={(e) => setPersonal({ ...personal, passwordConfirm: e.target.value })} className="pl-9" />
            </Field>
          </>
        )}
      </div>

      <hr />
      <h3 className="text-lg font-semibold">Endereço</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="CEP" icon={MapPin}>
          <Input value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} onBlur={onCepBlur} maxLength={9} className="pl-9" />
          {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </Field>
        <div className="sm:col-span-2"><Field label="Logradouro">
          <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
        </Field></div>
        <Field label="Número"><Input value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} /></Field>
        <Field label="Complemento"><Input value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} /></Field>
        <Field label="Bairro"><Input value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Cidade"><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></Field></div>
        <Field label="UF"><Input value={address.state} maxLength={2} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} /></Field>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={onContinue}>Continuar <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </CardContent></Card>
  );
}

function StepScholarship(props: {
  scholarship: any; course: any; institution: any;
  originalPrice: number; scholarshipPrice: number; discountPct: number; checkoutFee: number;
  acceptances: Acceptances; setAcceptances: (a: Acceptances) => void;
  onBack: () => void; onContinue: () => void;
}) {
  const { scholarship, course, institution, originalPrice, scholarshipPrice, discountPct, checkoutFee, acceptances, setAcceptances, onBack, onContinue } = props;
  return (
    <Card><CardContent className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Confirme os detalhes da bolsa</h2>

      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-start gap-4">
          {institution?.logo_url && <img src={institution.logo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{institution?.trade_name || institution?.name}</p>
            <h3 className="font-bold text-lg">{course?.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {course?.level && <Badge variant="secondary">{course.level}</Badge>}
              {course?.modality && <Badge variant="secondary">{course.modality}</Badge>}
              {course?.shift && <Badge variant="secondary">{course.shift}</Badge>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-primary">{discountPct}%</div>
            <div className="text-xs text-muted-foreground">de bolsa</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t">
          <div><div className="text-xs text-muted-foreground">Mensalidade cheia</div><div className="font-semibold line-through text-muted-foreground">{formatBRL(originalPrice)}</div></div>
          <div><div className="text-xs text-muted-foreground">Com bolsa</div><div className="font-bold text-success">{formatBRL(scholarshipPrice)}</div></div>
          <div><div className="text-xs text-muted-foreground">Taxa Tô de Bolsa</div><div className="font-bold">{formatBRL(checkoutFee)}</div></div>
        </div>
      </div>

      {scholarship.rules && (
        <div className="text-sm bg-muted/50 rounded-lg p-4">
          <p className="font-semibold mb-1">Condições da bolsa</p>
          <p className="text-muted-foreground whitespace-pre-line">{scholarship.rules}</p>
        </div>
      )}

      <div className="space-y-2 rounded-lg border p-4">
        <p className="font-semibold mb-2 text-sm">Aceites obrigatórios</p>
        <AcceptItem checked={acceptances.terms} onChange={(v) => setAcceptances({ ...acceptances, terms: v })}
          label={<>Li e aceito os <Link to="/termos" target="_blank" className="text-primary underline">Termos de Uso</Link></>} />
        <AcceptItem checked={acceptances.privacy} onChange={(v) => setAcceptances({ ...acceptances, privacy: v })}
          label={<>Li e aceito a <Link to="/privacidade" target="_blank" className="text-primary underline">Política de Privacidade</Link></>} />
        <AcceptItem checked={acceptances.conditions} onChange={(v) => setAcceptances({ ...acceptances, conditions: v })}
          label="Declaro que li e aceito as condições da bolsa" />
        <AcceptItem checked={acceptances.contract} onChange={(v) => setAcceptances({ ...acceptances, contract: v })}
          label="Entendo que a bolsa está sujeita às regras da instituição" />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <Button size="lg" onClick={onContinue}>Revisar compra <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </CardContent></Card>
  );
}

function StepReview(props: {
  personal: Personal; address: Address; course: any; institution: any; checkoutFee: number;
  onEditData: () => void; onEditScholarship: () => void; onContinue: () => void;
}) {
  const { personal, address, course, institution, checkoutFee, onEditData, onEditScholarship, onContinue } = props;
  return (
    <Card><CardContent className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Confira tudo antes de pagar</h2>

      <ReviewBlock title="Dados pessoais" onEdit={onEditData}>
        <p><b>{personal.name}</b></p>
        <p>{personal.email}</p>
        <p>{personal.phone}{personal.whatsapp && personal.whatsapp !== personal.phone ? ` · WhatsApp ${personal.whatsapp}` : ""}</p>
        {personal.cpf && <p>CPF {personal.cpf}</p>}
      </ReviewBlock>

      <ReviewBlock title="Endereço" onEdit={onEditData}>
        <p>{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}</p>
        <p>{address.neighborhood} · {address.city}/{address.state} · CEP {address.cep}</p>
      </ReviewBlock>

      <ReviewBlock title="Bolsa" onEdit={onEditScholarship}>
        <p><b>{institution?.trade_name || institution?.name}</b> · {course?.name}</p>
        <p className="text-muted-foreground">Você paga {formatBRL(checkoutFee)} ao Tô de Bolsa para receber sua Carta de Apresentação.</p>
      </ReviewBlock>

      <div className="flex justify-end">
        <Button size="lg" onClick={onContinue}>Confirmar e ir para pagamento <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </CardContent></Card>
  );
}

function StepStripePayment(props: {
  sessionToken: string;
  account: { name: string; email: string; password?: string; cpf?: string; phone?: string };
  checkoutFee: number;
  onBack: () => void;
}) {
  const { sessionToken, account, checkoutFee, onBack } = props;
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/checkout/retorno?session_token=${encodeURIComponent(sessionToken)}&session_id={CHECKOUT_SESSION_ID}`
    : "";

  return (
    <Card><CardContent className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Pagamento seguro</h2>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-success" /> Processado pela Stripe
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total a pagar agora</p>
          <p className="text-2xl font-extrabold">{formatBRL(checkoutFee)}</p>
        </div>
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </div>

      <StripeScholarshipCheckout
        sessionToken={sessionToken}
        account={account}
        returnUrl={returnUrl}
        onError={(msg) => toast.error(msg)}
      />

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar
        </Button>
      </div>
    </CardContent></Card>
  );
}


function SummaryCard(props: { institution: any; course: any; originalPrice: number; scholarshipPrice: number; discountPct: number; checkoutFee: number }) {
  const { institution, course, originalPrice, scholarshipPrice, discountPct, checkoutFee } = props;
  return (
    <Card className="sticky top-4"><CardContent className="p-5 space-y-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Resumo</p>
      <div className="flex items-start gap-3">
        {institution?.logo_url && <img src={institution.logo_url} alt="" className="h-10 w-10 rounded object-cover" />}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{institution?.trade_name || institution?.name}</p>
          <p className="font-semibold text-sm leading-tight">{course?.name}</p>
        </div>
      </div>
      <div className="rounded-lg bg-primary/10 p-3 text-center">
        <div className="text-2xl font-extrabold text-primary">{discountPct}% OFF</div>
        <div className="text-xs text-muted-foreground">na mensalidade</div>
      </div>
      <div className="text-sm space-y-1">
        <Row label="Mensalidade cheia" value={formatBRL(originalPrice)} muted strike />
        <Row label="Com bolsa" value={formatBRL(scholarshipPrice)} strong />
        <hr className="my-2" />
        <Row label="Taxa Tô de Bolsa" value={formatBRL(checkoutFee)} />
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold">Total a pagar agora</span>
          <span className="font-extrabold text-lg">{formatBRL(checkoutFee)}</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Mensalidades pagas diretamente à instituição.</p>
    </CardContent></Card>
  );
}

function Row({ label, value, muted, strike, strong }: { label: string; value: string; muted?: boolean; strike?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`${strike ? "line-through text-muted-foreground" : ""} ${strong ? "font-bold text-success" : ""}`}>{value}</span>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />}
        {children}
      </div>
    </div>
  );
}

function AcceptItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer py-1">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-sm">{title}</p>
        <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  );
}
