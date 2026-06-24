import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Globe, Phone, Mail } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { Button } from "@/components/ui/button";
import { getInstitutionBySlug, type ScholarshipListItem } from "@/lib/scholarships";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { ReviewStars } from "@/components/reviews/ReviewStars";

export const Route = createFileRoute("/instituicoes/$slug")({
  loader: async ({ params }) => {
    try {
      const inst = await getInstitutionBySlug(params.slug);
      return { institution: inst };
    } catch {
      return { institution: null };
    }
  },
  head: ({ params, loaderData }) => {
    const inst = loaderData?.institution as { trade_name?: string; description?: string | null; logo_url?: string | null } | null | undefined;
    const url = `https://todebolsa.lovable.app/instituicoes/${params.slug}`;
    const name = inst?.trade_name ?? params.slug;
    const title = `${name} — bolsas de estudo | Tô de Bolsa`;
    const desc = inst?.description ?? `Veja cursos, bolsas e unidades de ${name} no Tô de Bolsa.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        ...(inst?.logo_url ? [
          { property: "og:image", content: inst.logo_url },
          { name: "twitter:image", content: inst.logo_url },
        ] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Instituição não encontrada</h1>
          <Button asChild className="mt-6"><Link to="/bolsas">Ver bolsas</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: InstitutionPage,
});

function InstitutionPage() {
  const { slug } = Route.useParams();
  const { data: inst, isLoading } = useQuery({
    queryKey: ["institution", slug],
    queryFn: async () => {
      const r = await getInstitutionBySlug(slug);
      if (!r) throw notFound();
      return r;
    },
  });

  const { data: scholarships } = useQuery<ScholarshipListItem[]>({
    queryKey: ["institution-scholarships", inst?.id],
    enabled: !!inst?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select(`
          id, title, discount_type, discount_value, price_with_scholarship, is_featured, rules,
          course_offering:course_offerings!inner (
            id, vacancies_available, status,
            institution_unit:institution_units!inner ( id, name, city, state ),
            course:courses!inner (
              id, slug, name, level, modality, shift, duration_months, original_price, description,
              institution:institutions!inner ( id, slug, trade_name, logo_url, rating )
            )
          )
        `)
        .eq("is_active", true)
        .eq("course_offering.course.institution_id", inst!.id);
      if (error) throw error;
      return (data ?? []) as unknown as ScholarshipListItem[];
    },
  });

  if (isLoading || !inst) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 mx-auto max-w-6xl px-4 py-12 w-full">
          <div className="h-40 rounded-3xl bg-muted animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-brand-blue-soft/60 to-background border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 flex items-start gap-6 flex-wrap">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-blue text-brand-blue-foreground font-extrabold text-2xl shadow-[var(--shadow-elegant)]">
              {inst.trade_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl md:text-4xl font-extrabold">{inst.trade_name}</h1>
              {inst.description && (
                <p className="mt-2 text-muted-foreground max-w-2xl">{inst.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {inst.rating ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <strong className="text-foreground">{Number(inst.rating).toFixed(1)}</strong> de avaliação
                  </span>
                ) : null}
                {inst.website && (
                  <a href={inst.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Globe className="h-4 w-4" /> {inst.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {inst.phone && (
                  <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {inst.phone}</span>
                )}
                {inst.email && (
                  <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {inst.email}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-display text-2xl font-extrabold mb-6">Bolsas disponíveis</h2>
          {scholarships && scholarships.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {scholarships.map((s) => <ScholarshipCard key={s.id} s={s} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Nenhuma bolsa ativa no momento.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
