import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/validar-carta/$codigo")({
  component: ValidarCartaPage,
  head: ({ params }) => ({
    meta: [
      { title: `Validar carta ${params.codigo} · Tô de Bolsa` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ISSUED: { label: "Válida", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  USED: { label: "Já utilizada (matrícula efetivada)", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  EXPIRED: { label: "Expirada", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  CANCELLED: { label: "Cancelada", cls: "bg-red-100 text-red-700 border-red-200" },
};

function ValidarCartaPage() {
  const { codigo } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["validate-letter", codigo],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_letter_by_code", { p_code: codigo });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as any;
      return (row ?? null) as null | {
        unique_code: string; status: string; issued_at: string; expires_at: string;
        student_first_name: string | null; scholarship_title: string; course_name: string;
        institution_trade_name: string; unit_name: string | null; unit_city: string | null;
        unit_state: string | null; discount_percent: number | null;
        monthly_with_scholarship: number | null; monthly_original: number | null;
      };
    },
  });

  return (
    <div className="min-h-[80vh] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Tô de Bolsa
        </Link>

        {isLoading && <div className="h-72 rounded-3xl bg-muted animate-pulse" />}

        {!isLoading && !data && (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="font-display text-2xl font-extrabold mt-3">Carta não encontrada</h1>
            <p className="text-sm text-muted-foreground mt-2">
              O código <strong>{codigo}</strong> não corresponde a uma Carta de Apresentação emitida pelo Tô de Bolsa.
              {error ? ` (${String(error)})` : ""}
            </p>
          </div>
        )}

        {data && (
          <article className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Carta de Apresentação</p>
                <h1 className="font-display text-2xl font-extrabold mt-1">{data.unique_code}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Emitida em {new Date(data.issued_at).toLocaleDateString("pt-BR")} · Válida até{" "}
                  {new Date(data.expires_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge className={`border ${STATUS_BADGE[data.status]?.cls ?? ""}`}>
                {data.status === "ISSUED" ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : data.status === "EXPIRED" ? <Clock className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                {STATUS_BADGE[data.status]?.label ?? data.status}
              </Badge>
            </header>

            <section className="grid sm:grid-cols-2 gap-3">
              <Info label="Estudante" value={data.student_first_name ? `${data.student_first_name} ···` : "—"} />
              <Info label="Instituição" value={data.institution_trade_name} />
              <Info label="Curso" value={data.course_name} />
              <Info label="Unidade" value={data.unit_name ? `${data.unit_name} — ${data.unit_city}/${data.unit_state}` : "—"} />
              <Info label="Bolsa" value={data.scholarship_title} />
              <Info label="Desconto" value={data.discount_percent != null ? `${data.discount_percent}%` : "—"} />
              <Info label="Mensalidade original" value={formatBRL(Number(data.monthly_original ?? 0))} />
              <Info label="Mensalidade com bolsa" value={formatBRL(Number(data.monthly_with_scholarship ?? 0))} />
            </section>

            <footer className="text-xs text-muted-foreground border-t border-border pt-4">
              Este documento confirma a reserva da bolsa por meio do Tô de Bolsa.
              A matrícula acadêmica e o pagamento das mensalidades, quando houver, são tratados
              diretamente entre o estudante e a instituição de ensino, conforme as condições da oferta.
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
