import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  IdCard,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/carteira")({
  component: CarteiraPage,
});

const ELIGIBLE = [
  "CONFIRMED",
  "UNDER_REVIEW",
  "AWAITING_ENROLLMENT",
  "ENROLLMENT_APPROVED",
] as const;

type WalletReservation = {
  reservation_code: string;
  status: string;
  created_at: string;
  scholarship: {
    course_offering: {
      course: {
        name: string;
        level: string;
        institution: { trade_name: string; city: string | null; state: string | null } | null;
      } | null;
    } | null;
  } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CarteiraPage() {
  const { user, profile } = useAuth();
  const uid = user?.id;
  const name = profile?.name ?? user?.email?.split("@")[0] ?? "Estudante";

  const { data: reservations, isLoading } = useQuery({
    enabled: !!uid,
    queryKey: ["wallet-reservations", uid],
    queryFn: async (): Promise<WalletReservation[]> => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `reservation_code, status, created_at,
           scholarship:scholarships(
             course_offering:course_offerings(
               course:courses(name, level, institution:institutions(trade_name, city, state))
             )
           )`,
        )
        .eq("user_id", uid!)
        .in("status", ELIGIBLE)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WalletReservation[];
    },
  });

  const active = reservations?.[0] ?? null;

  const validUntil = useMemo(() => {
    if (!active) return null;
    const d = new Date(active.created_at);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }, [active]);

  const validationUrl = useMemo(() => {
    if (!active) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/public/uge/validar/${active.reservation_code}`;
  }, [active]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!validationUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(validationUrl, {
      width: 480,
      margin: 1,
      color: { dark: "#0B1437", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [validationUrl]);

  const institution = active?.scholarship?.course_offering?.course?.institution?.trade_name ?? null;
  const courseName = active?.scholarship?.course_offering?.course?.name ?? null;

  async function copyCode() {
    if (!active) return;
    await navigator.clipboard.writeText(active.reservation_code);
    toast.success("Código copiado");
  }

  async function downloadPDF() {
    if (!active || !qrDataUrl || !validUntil) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(11, 20, 55);
    doc.rect(0, 0, W, 110, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("UNIÃO GERAL DOS ESTUDANTES DO BRASIL", 40, 50);
    doc.setFontSize(20);
    doc.text("Carteira de Estudante Digital", 40, 80);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 160;
    const line = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 200, y);
      y += 24;
    };
    line("Nome:", name);
    line("Código UGE:", active.reservation_code);
    if (institution) line("Instituição:", institution);
    if (courseName) line("Curso:", courseName);
    line("Emitida em:", formatDate(active.created_at));
    line("Válida até:", formatDate(validUntil.toISOString()));

    doc.addImage(qrDataUrl, "PNG", W - 220, 140, 180, 180);

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(
      "Apresente este documento (impresso ou digital) acompanhado de documento oficial com foto.",
      40,
      y + 30,
      { maxWidth: W - 80 },
    );
    doc.text(
      `Validar em: ${validationUrl}`,
      40,
      y + 60,
      { maxWidth: W - 80 },
    );
    doc.text("Tô de Bolsa · todebolsa.com.br", 40, y + 90);

    doc.save(`carteira-uge-${active.reservation_code}.pdf`);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <IdCard className="h-7 w-7 text-primary" /> Carteira UGE Digital
        </h1>
        <p className="text-muted-foreground mt-1">
          Emitida pela União Geral dos Estudantes do Brasil — válida para meia-entrada em todo o país.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Carregando sua carteira…
        </div>
      ) : !active ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 mx-auto text-warning" />
          <h2 className="font-display text-xl font-bold">Sua carteira ainda não está ativa</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A Carteira UGE é ativada automaticamente assim que você confirma a matrícula em
            uma bolsa reservada pelo Tô de Bolsa.
          </p>
          <Button asChild>
            <Link to="/bolsas">Buscar bolsas</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl bg-hero text-hero-foreground p-6 sm:p-8 min-h-[320px]">
            <div aria-hidden className="absolute -top-10 -left-10 h-60 w-60 rounded-full bg-primary/30 blur-3xl" />
            <div aria-hidden className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative h-full flex flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] tracking-widest opacity-80">UNIÃO GERAL DOS ESTUDANTES</div>
                  <div className="font-display text-xl font-extrabold">CARTEIRA DE ESTUDANTE</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 text-success px-3 py-1 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
                </span>
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-end">
                <div>
                  <div className="text-xs opacity-70 uppercase tracking-wide">Nome</div>
                  <div className="font-display text-xl sm:text-2xl font-bold truncate">{name}</div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] opacity-70 uppercase tracking-wide">Código UGE</div>
                      <div className="font-mono text-sm">{active.reservation_code}</div>
                    </div>
                    <div>
                      <div className="text-[10px] opacity-70 uppercase tracking-wide">Validade</div>
                      <div className="font-mono text-sm">{validUntil ? formatDate(validUntil.toISOString()) : "—"}</div>
                    </div>
                    {institution && (
                      <div className="col-span-2">
                        <div className="text-[10px] opacity-70 uppercase tracking-wide">Instituição</div>
                        <div className="text-sm font-semibold truncate">{institution}</div>
                      </div>
                    )}
                  </div>
                </div>
                {qrDataUrl && (
                  <div className="rounded-2xl bg-white p-2 shadow-lg shrink-0">
                    <img src={qrDataUrl} alt="QR Code da carteira" className="h-32 w-32" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side */}
          <aside className="space-y-3">
            <Button className="w-full gap-2" onClick={downloadPDF} disabled={!qrDataUrl}>
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={copyCode}>
              <Copy className="h-4 w-4" />
              Copiar código
            </Button>
            {validationUrl && (
              <Button asChild variant="ghost" className="w-full gap-2">
                <a href={validationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Testar validação
                </a>
              </Button>
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-bold mb-1">QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Apresente na bilheteria — o QR aponta para uma URL pública de validação em tempo real.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold mb-1">Validade nacional</h3>
              <p className="text-sm text-muted-foreground">
                Reconhecida em cinemas, shows, teatros e eventos esportivos em todo o Brasil.
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="rounded-2xl bg-accent/15 text-accent-foreground p-5 text-sm">
        <strong>Dica:</strong> sempre leve um documento oficial com foto junto com a carteira (impressa ou no celular).
      </div>
    </div>
  );
}
