import { ShieldCheck, Lock, IdCard, Scale } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Site seguro", text: "HTTPS e dados criptografados" },
  { icon: Lock, title: "Pagamento protegido", text: "Antifraude e estorno garantido" },
  { icon: Scale, title: "LGPD", text: "Seus dados sob controle" },
  { icon: IdCard, title: "Carteira UGE", text: "Reconhecida em todo o Brasil" },
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
