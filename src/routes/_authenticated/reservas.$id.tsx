import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, CreditCard, Download, FileText, Loader2, QrCode, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { DocumentUpload } from "@/components/enrollment/DocumentUpload";
import { downloadScholarshipLetterPdf } from "@/lib/letter-pdf";

export const Route = createFileRoute("/_authenticated/reservas/$id")({
  component: ReservationDetailPage,
});

type Method = "PIX" | "BOLETO" | "CARD";

const STATUS_LABEL: Record<string, string> = {
  RESERVED: "Reservada",
  PAYMENT_PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  UNDER_REVIEW: "Em análise",
  AWAITING_ENROLLMENT: "Aguardando matrícula",
  ENROLLMENT_APPROVED: "Matrícula aprovada",
  ENROLLMENT_REJECTED: "Matrícula recusada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "Expirada";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ReservationDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("PIX");

  const { data: r, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["reservation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, status, payment_status, reservation_code, expires_at, reserved_at, amount_paid, institution_id,
          scholarship:scholarships(id, title, price_with_scholarship,
            course_offering:course_offerings(
              course:courses(name, original_price, institution:institutions(trade_name, slug)),
              institution_unit:institution_units(name, city, state)
            )
          )
        `)
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pay = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("pay_reservation", { p_reservation_id: id, p_method: method });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation", id] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Pagamento confirmado!");
    },
    onError: (e: Error) => toast.error(e.message || "Falha no pagamento."),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cancel_reservation", { p_reservation_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada.");
      navigate({ to: "/reservas" });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao cancelar."),
  });

  const countdown = useCountdown(r?.expires_at ?? null);

  if (isLoading) return <div className="h-72 rounded-3xl bg-muted animate-pulse" />;
  if (!r) return (
    <div className="rounded-3xl border border-border bg-card p-10 text-center">
      <p className="text-muted-foreground">Reserva não encontrada.</p>
      <Button asChild className="mt-4"><Link to="/reservas">Voltar</Link></Button>
    </div>
  );

  const course = r.scholarship?.course_offering?.course;
  const inst = course?.institution;
  const unit = r.scholarship?.course_offering?.institution_unit;
  const monthlyScholarship = Number(r.scholarship?.price_with_scholarship ?? 0);
  const original = Number(course?.original_price ?? 0);
  const marketplaceFee = Number(r.amount_paid ?? 0);
  const discountPct = original > 0
    ? Math.round(((original - monthlyScholarship) / original) * 100)
    : null;

  const needsPayment = r.status === "PAYMENT_PENDING" || r.status === "RESERVED";
  const isFinal = ["EXPIRED", "CANCELLED", "ENROLLMENT_APPROVED", "ENROLLMENT_REJECTED"].includes(r.status);
  const isPaid = !["RESERVED", "PAYMENT_PENDING", "EXPIRED", "CANCELLED"].includes(r.status);

  // Fetch carta de apresentação após pagamento
  const { data: letter } = useQuery({
    enabled: isPaid,
    queryKey: ["scholarship-letter", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("scholarship_letters")
        .select("unique_code, status, issued_at, expires_at")
        .eq("reservation_id", id)
        .maybeSingle();
      if (error) throw error;
      return data as null | { unique_code: string; status: string; issued_at: string; expires_at: string };
    },
  });

  async function handleDownloadLetter() {
    if (!letter || !user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, cpf")
        .eq("id", user.id)
        .maybeSingle();
      await downloadScholarshipLetterPdf({
        unique_code: letter.unique_code,
        issued_at: letter.issued_at,
        expires_at: letter.expires_at,
        student_name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Estudante",
        student_cpf: profile?.cpf ?? null,
        reservation_code: r.reservation_code,
        scholarship_title: r.scholarship?.title ?? "",
        course_name: course?.name ?? "",
        institution_trade_name: inst?.trade_name ?? "",
        institution_cnpj: null,
        unit_name: unit?.name ?? null,
        unit_city: unit?.city ?? null,
        unit_state: unit?.state ?? null,
        discount_percent: discountPct,
        monthly_original: original,
        monthly_with_scholarship: monthlyScholarship,
        required_documents: null,
        rules: null,
      });
    } catch (e) {
      toast.error((e as Error).message || "Falha ao gerar carta.");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/reservas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="h-4 w-4" /> Minhas reservas
      </Link>

      <header className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{inst?.trade_name}</div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-1">{course?.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{r.scholarship?.title}</p>
            {unit && <p className="text-xs text-muted-foreground mt-1">{unit.name} · {unit.city}/{unit.state}</p>}
          </div>
          <Badge className="bg-primary-soft text-primary border-0">{STATUS_LABEL[r.status] ?? r.status}</Badge>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <Info label="Código da reserva" value={r.reservation_code} />
          <Info label="Mensalidade c/ bolsa" value={formatBRL(monthlyScholarship)} />
          <Info label="Mensalidade original" value={original ? formatBRL(original) : "—"} strike />
        </div>

        {needsPayment && r.expires_at && (
          <div className="mt-5 rounded-2xl bg-warning/10 border border-warning/30 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning-foreground" />
            <div className="text-sm">
              <span className="font-semibold">Esta reserva expira em </span>
              <span className="font-mono font-bold">{countdown}</span>
            </div>
          </div>
        )}
      </header>

      {needsPayment && countdown !== "Expirada" && (
        <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Pagar taxa de adesão
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Confirme sua vaga pagando a taxa única de adesão de <strong>{formatBRL(ADHESION_FEE)}</strong>. A mensalidade
            com bolsa é cobrada apenas pela instituição após a matrícula.
          </p>

          <div className="mt-5 grid sm:grid-cols-3 gap-2">
            <MethodOption active={method === "PIX"} onClick={() => setMethod("PIX")} icon={QrCode} label="Pix" hint="Aprovação imediata" />
            <MethodOption active={method === "BOLETO"} onClick={() => setMethod("BOLETO")} icon={FileText} label="Boleto" hint="Compensa em 1-2 dias" />
            <MethodOption active={method === "CARD"} onClick={() => setMethod("CARD")} icon={CreditCard} label="Cartão" hint="Crédito ou débito" />
          </div>

          {method === "PIX" && (
            <div className="mt-5 rounded-2xl bg-secondary/60 p-5 flex flex-col items-center text-center">
              <div className="h-32 w-32 bg-foreground/10 rounded-xl grid place-items-center">
                <QrCode className="h-16 w-16 text-foreground/40" />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">QR Code simulado · Pagamento confirmado instantaneamente</div>
            </div>
          )}
          {method === "BOLETO" && (
            <div className="mt-5 rounded-2xl bg-secondary/60 p-5 font-mono text-xs break-all">
              23793.38128 60082.123456 78901.234567 8 9876{Date.now().toString().slice(-10)}
            </div>
          )}
          {method === "CARD" && (
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <input className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="Número do cartão" />
              <input className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="Nome impresso" />
              <input className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="MM/AA" />
              <input className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="CVV" />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 justify-between items-center">
            <Button variant="ghost" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar reserva
            </Button>
            <Button size="lg" onClick={() => pay.mutate()} disabled={pay.isPending} className="font-semibold">
              {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pagar {formatBRL(ADHESION_FEE)}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            🧪 Ambiente de demonstração. Nenhuma cobrança real é feita.
          </p>
        </section>
      )}

      {r.status === "CONFIRMED" && (
        <section className="rounded-3xl border border-primary/30 bg-primary-soft/50 p-6 md:p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-display text-xl font-extrabold mt-3">Bolsa confirmada!</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Agora envie seus documentos abaixo para a instituição finalizar sua matrícula.
          </p>
        </section>
      )}

      {(r.status === "CONFIRMED" || r.status === "UNDER_REVIEW" || r.status === "AWAITING_ENROLLMENT") && user && (
        <DocumentUpload reservationId={r.id} userId={user.id} />
      )}

      {r.status === "ENROLLMENT_APPROVED" && user && r.institution_id && (
        <ReviewForm
          reservationId={r.id}
          institutionId={r.institution_id}
          userId={user.id}
        />
      )}

      {isFinal && (
        <section className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">Esta reserva foi finalizada como <strong>{STATUS_LABEL[r.status]}</strong>.</p>
          <Button asChild className="mt-3"><Link to="/bolsas">Buscar outras bolsas</Link></Button>
        </section>
      )}
    </div>
  );
}

function Info({ label, value, strike }: { label: string; value: string; strike?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-bold mt-0.5", strike && "line-through text-muted-foreground")}>{value}</div>
    </div>
  );
}

function MethodOption({
  active, onClick, icon: Icon, label, hint,
}: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <button onClick={onClick} className={cn(
      "rounded-2xl border-2 p-4 text-left transition-colors",
      active ? "border-primary bg-primary-soft/40" : "border-border bg-card hover:border-primary/40",
    )}>
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
      <div className="font-bold mt-2">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}
