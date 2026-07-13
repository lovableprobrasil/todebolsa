import { ShieldCheck, Lock, Sparkles, LifeBuoy } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Instituições parceiras verificadas", text: "Cadastros conferidos antes da publicação" },
  { icon: Sparkles, title: "Processo digital", text: "Contratação online, sem filas ou papelada" },
  { icon: Lock, title: "Pagamento protegido", text: "Processado em ambiente seguro" },
  { icon: LifeBuoy, title: "Suporte durante a contratação", text: "Time do Tô de Bolsa acompanha você" },
];

export function TrustBadges() {
  return (
    <section aria-label="Confiança e segurança" className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ITEMS.map((i) => (
            <div key={i.title} className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <i.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight">{i.title}</div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5">{i.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
