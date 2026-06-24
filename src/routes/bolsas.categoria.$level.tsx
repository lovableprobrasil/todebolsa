import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { listScholarships } from "@/lib/scholarships";
import { CATEGORIES, COURSE_LEVEL_LABEL } from "@/lib/format";

const SITE = "https://todebolsa.lovable.app";

export const Route = createFileRoute("/bolsas/categoria/$level")({
  beforeLoad: ({ params }) => {
    if (!(params.level in COURSE_LEVEL_LABEL)) throw notFound();
  },
  head: ({ params }) => {
    const label = COURSE_LEVEL_LABEL[params.level] ?? params.level;
    const title = `Bolsas em ${label} com até 90% de desconto | Tô de Bolsa`;
    const desc = `Encontre bolsas de estudo em ${label.toLowerCase()} no Brasil. Compare preços, instituições e descontos em uma só plataforma.`;
    const url = `${SITE}/bolsas/categoria/${params.level}`;
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: desc,
            url,
          }),
        },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { level } = Route.useParams();
  const label = COURSE_LEVEL_LABEL[level] ?? level;
  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "by-level", level],
    queryFn: () => listScholarships({ level, limit: 60 }),
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
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">Bolsas em {label}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Reservamos as melhores bolsas de {label.toLowerCase()} para você. Compare instituições, mensalidades
            e descontos em todo o Brasil.
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
            <p className="font-semibold mb-1">Sem bolsas disponíveis em {label} no momento.</p>
            <Link to="/bolsas" className="text-primary text-sm hover:underline">Ver todas as bolsas</Link>
          </div>
        )}

        <section className="mt-12 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-extrabold">Explore outras modalidades</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== level).map((c) => (
              <Link
                key={c.slug}
                to="/bolsas/categoria/$level"
                params={{ level: c.slug }}
                className="rounded-full bg-secondary px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
