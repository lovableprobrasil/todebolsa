import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { listScholarships } from "@/lib/scholarships";

const SITE = "https://todebolsa.lovable.app";

function pretty(city: string) {
  return decodeURIComponent(city)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Route = createFileRoute("/bolsas/cidade/$city")({
  head: ({ params }) => {
    const city = pretty(params.city);
    const title = `Bolsas de estudo em ${city} | Tô de Bolsa`;
    const desc = `Bolsas de estudo em ${city} com até 90% de desconto. Escolas, faculdades, cursos técnicos e idiomas.`;
    const url = `${SITE}/bolsas/cidade/${params.city}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CityPage,
});

function CityPage() {
  const { city } = Route.useParams();
  const label = pretty(city);
  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "by-city", city],
    queryFn: () => listScholarships({ city: label, limit: 60 }),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:underline">Início</Link>
            <span className="mx-2">›</span>
            <Link to="/bolsas" className="hover:underline">Bolsas</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground font-medium">{label}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">Bolsas de estudo em {label}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Veja todas as bolsas disponíveis em {label} — escolas, faculdades, cursos técnicos e de idiomas.
          </p>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((s) => <ScholarshipCard key={s.id} s={s} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold mb-1">Sem bolsas em {label} no momento.</p>
            <Link to="/bolsas" className="text-primary text-sm hover:underline">Ver todas as bolsas</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
