import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Copy, Gift, Share2, Trophy, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { isValidCPF, maskCPF, onlyDigits } from "@/lib/validators/cnpj";

export const Route = createFileRoute("/_authenticated/indicacoes")({
  component: ReferralPage,
});

type Summary = {
  code: string;
  referred_count: number;
  paid_count: number;
  total_earned: number;
  total_paid_out: number;
  pending_payout: number;
  balance: number;
  badges: string[];
};

const BADGE_META: Record<string, { label: string; emoji: string; hint: string }> = {
  first_referral: { label: "Primeira indicação", emoji: "🎯", hint: "Você indicou seu primeiro aluno." },
  five_referrals: { label: "5 indicações", emoji: "⭐", hint: "Cinco amigos matriculados." },
  ten_referrals: { label: "10 indicações", emoji: "🏆", hint: "Você é referência!" },
  top_promoter: { label: "Top promotor", emoji: "💎", hint: "25+ matrículas indicadas." },
};

function ReferralPage() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(50);
  const [pixKey, setPixKey] = useState("");
  const [pixType, setPixType] = useState("CPF");

  const { data: s } = useQuery({
    queryKey: ["referral-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("referral_summary");
      if (error) throw error;
      return data as unknown as Summary;
    },
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("referral_leaderboard", { p_limit: 10 });
      if (error) throw error;
      return (data ?? []) as Array<{ short_name: string; referrals: number; earned: number }>;
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["referral-payouts-me"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_payouts")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const link = s?.code ? `${window.location.origin}/auth?ref=${s.code}` : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tô de Bolsa — bolsas com até 90% de desconto",
          text: "Use meu link e garanta sua bolsa de estudo:",
          url: link,
        });
      } catch {/* user cancelled */}
    } else copy();
  };

  const pixCpfInvalid = pixType === "CPF" && pixKey.length > 0 && !isValidCPF(pixKey);

  const requestPayout = useMutation({
    mutationFn: async () => {
      if (pixType === "CPF" && !isValidCPF(pixKey)) {
        throw new Error("CPF inválido.");
      }
      const { error } = await supabase.rpc("request_referral_payout", {
        p_amount: amount,
        p_pix_key: pixType === "CPF" ? onlyDigits(pixKey) : pixKey,
        p_pix_type: pixType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saque solicitado! Você receberá o PIX em até 2 dias úteis.");
      setPixKey("");
      qc.invalidateQueries({ queryKey: ["referral-summary"] });
      qc.invalidateQueries({ queryKey: ["referral-payouts-me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <Gift className="h-7 w-7 text-primary" /> Indique e ganhe R$ 25
        </h1>
        <p className="text-muted-foreground mt-1">
          Para cada amigo que confirmar a reserva usando seu link, você ganha <strong>R$ 25 em crédito</strong>,
          que pode ser usado em reservas próprias ou sacado via PIX (a partir de R$ 25).
        </p>
      </header>

      <section className="rounded-3xl border border-primary/30 bg-primary-soft/30 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Seu link de indicação</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[200px] rounded-xl bg-background border border-border px-3 py-2 text-sm font-mono break-all">
            {link || "carregando..."}
          </code>
          <Button onClick={copy} variant="secondary"><Copy className="h-4 w-4 mr-1" /> Copiar</Button>
          <Button onClick={share}><Share2 className="h-4 w-4 mr-1" /> Compartilhar</Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Código: <strong>{s?.code ?? "—"}</strong></div>
      </section>

      <section className="grid sm:grid-cols-4 gap-3">
        <Stat label="Indicados" value={s?.referred_count ?? 0} />
        <Stat label="Matrículas pagas" value={s?.paid_count ?? 0} />
        <Stat label="Saldo disponível" value={formatBRL(s?.balance ?? 0)} highlight />
        <Stat label="Total recebido" value={formatBRL(s?.total_paid_out ?? 0)} />
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="rounded-3xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-display font-bold flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Sacar via PIX</h2>
          <p className="text-sm text-muted-foreground">Saldo disponível: <strong>{formatBRL(s?.balance ?? 0)}</strong></p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input type="number" min={25} step={5} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Valor" />
            <Select value={pixType} onValueChange={(v) => { setPixType(v); setPixKey(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="EMAIL">E-mail</SelectItem>
                <SelectItem value="PHONE">Telefone</SelectItem>
                <SelectItem value="RANDOM">Chave aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={pixKey}
            onChange={(e) => setPixKey(pixType === "CPF" ? maskCPF(e.target.value) : e.target.value)}
            placeholder={pixType === "CPF" ? "000.000.000-00" : "Sua chave PIX"}
            inputMode={pixType === "CPF" ? "numeric" : undefined}
            aria-invalid={pixCpfInvalid || undefined}
            className={pixCpfInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {pixCpfInvalid && <p className="text-xs text-destructive">CPF inválido.</p>}
          <Button
            disabled={requestPayout.isPending || !pixKey || pixCpfInvalid || (s?.balance ?? 0) < amount}
            onClick={() => requestPayout.mutate()}
          >
            Solicitar saque
          </Button>
          {(s?.pending_payout ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">Saques em processamento: {formatBRL(s!.pending_payout)}.</p>
          )}
        </article>

        <article className="rounded-3xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-display font-bold flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Suas conquistas</h2>
          {(s?.badges ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Indique seu primeiro amigo para destravar o primeiro badge.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {(s?.badges ?? []).map((b) => {
                const meta = BADGE_META[b] ?? { label: b, emoji: "🏅", hint: "" };
                return (
                  <li key={b} className="rounded-2xl bg-secondary/50 p-3 flex items-center gap-3">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{meta.hint}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Ranking público</h2>
        <ol className="mt-4 space-y-2">
          {leaderboard.length === 0 && <li className="text-sm text-muted-foreground italic">Seja o primeiro do ranking!</li>}
          {leaderboard.map((row, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5">
              <span className="flex items-center gap-3">
                <span className="font-bold text-primary w-6">{i + 1}º</span>
                <span className="font-medium">{row.short_name}</span>
              </span>
              <span className="text-sm text-muted-foreground">{row.referrals} indicação(ões) · {formatBRL(Number(row.earned))}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display font-bold">Histórico de saques</h2>
        <div className="mt-3 space-y-2">
          {payouts.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum saque solicitado.</p>}
          {payouts.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-sm">
              <span>{new Date(p.requested_at).toLocaleDateString("pt-BR")} · {p.pix_key_type} · {p.pix_key}</span>
              <span className="flex items-center gap-2">
                <strong>{formatBRL(Number(p.amount))}</strong>
                <Badge className="border-0 bg-primary-soft text-primary">{p.status}</Badge>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-primary bg-primary-soft/40" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="font-display font-extrabold text-xl mt-1">{value}</div>
    </div>
  );
}
