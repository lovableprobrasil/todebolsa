import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Mariana Souza",
    course: "Direito · São Paulo",
    text: "Consegui uma bolsa de 70% em uma faculdade ótima. Sem o Tô de Bolsa eu não teria conseguido começar a faculdade esse ano.",
    initials: "MS",
  },
  {
    name: "Lucas Pereira",
    course: "Engenharia de Software · EAD",
    text: "Em duas semanas eu já tinha reservado minha vaga e recebido a carteira UGE. Processo simples e rápido demais.",
    initials: "LP",
  },
  {
    name: "Aline Ferreira",
    course: "Pedagogia · Belo Horizonte",
    text: "Comparei várias opções na mesma plataforma. Achei a bolsa certa, no curso certo, na cidade certa. Recomendo demais.",
    initials: "AF",
  },
];

export function StudentTestimonials() {
  return (
    <section className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
            <Star className="h-3.5 w-3.5 fill-primary" />
            Histórias reais
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">
            Alunos que já garantiram sua bolsa
          </h2>
          <p className="mt-3 text-muted-foreground">
            Mais de 200 mil alunos beneficiados em todo o Brasil.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <Quote className="h-6 w-6 text-primary mb-3" />
              <blockquote className="text-sm text-foreground/85 leading-relaxed flex-1">
                "{t.text}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary font-display font-extrabold text-sm">
                  {t.initials}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.course}</div>
                </div>
                <div className="ml-auto flex" aria-label="5 estrelas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
