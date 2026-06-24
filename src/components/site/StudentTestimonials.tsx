import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Testimonial = {
  name: string;
  course: string;
  text: string;
  initials: string;
  rating: number;
};

const FALLBACK: Testimonial[] = [
  {
    name: "Mariana Souza",
    course: "Direito · São Paulo",
    text: "Consegui uma bolsa de 70% em uma faculdade ótima. Sem o Tô de Bolsa eu não teria conseguido começar a faculdade esse ano.",
    initials: "MS",
    rating: 5,
  },
  {
    name: "Lucas Pereira",
    course: "Engenharia de Software · EAD",
    text: "Em duas semanas eu já tinha reservado minha vaga e recebido a carteira UGE. Processo simples e rápido demais.",
    initials: "LP",
    rating: 5,
  },
  {
    name: "Aline Ferreira",
    course: "Pedagogia · Belo Horizonte",
    text: "Comparei várias opções na mesma plataforma. Achei a bolsa certa, no curso certo, na cidade certa. Recomendo demais.",
    initials: "AF",
    rating: 5,
  },
];

function shortName(full: string | null | undefined): { display: string; initials: string } {
  const name = (full ?? "").trim();
  if (!name) return { display: "Estudante", initials: "ES" };
  const parts = name.split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + "." : "";
  const initials = (first[0] ?? "E") + (parts[1]?.[0] ?? parts[0][1] ?? "");
  return {
    display: `${first}${lastInitial ? " " + lastInitial : ""}`,
    initials: initials.toUpperCase().slice(0, 2),
  };
}

export function StudentTestimonials() {
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: reviews } = await supabase
        .from("institution_reviews")
        .select("rating, comment, user_id, institution_id")
        .eq("status", "APPROVED")
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (cancelled || !reviews || reviews.length === 0) return;

      const userIds = Array.from(new Set(reviews.map((r) => r.user_id)));
      const instIds = Array.from(new Set(reviews.map((r) => r.institution_id)));

      const [{ data: profiles }, { data: insts }] = await Promise.all([
        supabase.from("profiles").select("id, name").in("id", userIds),
        supabase.from("institutions").select("id, trade_name").in("id", instIds),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
      const instMap = new Map((insts ?? []).map((i) => [i.id, i.trade_name]));

      const mapped: Testimonial[] = reviews
        .filter((r) => (r.comment ?? "").trim().length > 20)
        .slice(0, 3)
        .map((r) => {
          const { display, initials } = shortName(profileMap.get(r.user_id) as string | undefined);
          return {
            name: display,
            course: (instMap.get(r.institution_id) as string | undefined) ?? "Instituição parceira",
            text: r.comment ?? "",
            initials,
            rating: r.rating ?? 5,
          };
        });

      if (mapped.length > 0) setItems(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {items.map((t, idx) => (
            <figure
              key={`${t.name}-${idx}`}
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
                <div className="ml-auto flex" aria-label={`${t.rating} estrelas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < t.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                    />
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
