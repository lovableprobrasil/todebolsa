import { createFileRoute } from "@tanstack/react-router";
import { IdCard, Download, QrCode, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/carteira")({
  component: CarteiraPage,
});

function CarteiraPage() {
  const { user, profile } = useAuth();
  const name = profile?.name ?? user?.email?.split("@")[0] ?? "Estudante";
  const number = (user?.id ?? "").replace(/-/g, "").slice(0, 12).toUpperCase();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <IdCard className="h-7 w-7 text-primary" /> Carteira UGE Digital
        </h1>
        <p className="text-muted-foreground mt-1">
          Emitida pela União Geral dos Estudantes do Brasil — válida para meia-entrada.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-hero text-hero-foreground p-6 sm:p-8 aspect-[16/9] min-h-[280px]">
          <div aria-hidden className="absolute -top-10 -left-10 h-60 w-60 rounded-full bg-primary/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest opacity-80">UNIÃO GERAL DOS ESTUDANTES</div>
                <div className="font-display text-xl font-extrabold">CARTEIRA DE ESTUDANTE</div>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <IdCard className="h-5 w-5" />
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 uppercase tracking-wide">Nome</div>
              <div className="font-display text-xl sm:text-2xl font-bold truncate">{name}</div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] opacity-70 uppercase tracking-wide">Matrícula</div>
                  <div className="font-mono text-sm">{number || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-70 uppercase tracking-wide">Validade</div>
                  <div className="font-mono text-sm">12/{new Date().getFullYear() + 1}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="font-bold mb-1">QR Code</h3>
            <p className="text-sm text-muted-foreground">Apresente para validação na bilheteria.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold mb-1">Validade nacional</h3>
            <p className="text-sm text-muted-foreground">Reconhecida em cinemas, shows, teatros e eventos esportivos.</p>
          </div>
          <Button className="w-full gap-2" disabled>
            <Download className="h-4 w-4" />
            Baixar PDF (em breve)
          </Button>
        </aside>
      </div>

      <div className="rounded-2xl bg-accent/15 text-accent-foreground p-5 text-sm">
        <strong>Atenção:</strong> sua carteira é ativada automaticamente após a confirmação da
        matrícula em uma das bolsas reservadas no Tô de Bolsa.
      </div>
    </div>
  );
}
