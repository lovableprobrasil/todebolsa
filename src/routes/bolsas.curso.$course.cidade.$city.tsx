import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { listScholarships } from "@/lib/scholarships";
import { COURSE_LEVEL_LABEL, CATEGORIES, formatBRL } from "@/lib/format";

const SITE = "https://todebolsa.lovable.app";

function prettyCity(city: string) {
  return decodeURIComponent(city)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Route = createFileRoute("/bolsas/curso/$course/cidade/$city")({
  beforeLoad: ({ params }) => {
    if (!(params.course in COURSE_LEVEL_LABEL)) throw notFound();
  },
  head: ({ params }) => {
    const courseLabel = COURSE_LEVEL_LABEL[params.course] ?? params.course;
    const cityLabel = prettyCity(params.city);
    const title = `Bolsas de ${courseLabel} em ${cityLabel} | Tô de Bolsa`;
    const desc = `Encontre bolsas de estudo em ${courseLabel.toLowerCase()} em ${cityLabel} com até 90% de desconto. Compare instituições, preços e descontos.`;
    const url = `${SITE}/bolsas/curso/${params.course}/cidade/${params.city}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Bolsas", item: `${SITE}/bolsas` },
              { "@type": "ListItem", position: 3, name: courseLabel, item: `${SITE}/bolsas/categoria/${params.course}` },
              { "@type": "ListItem", position: 4, name: cityLabel, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ComboPage,
});

function ComboPage() {
  const { course, city } = Route.useParams();
  const courseLabel = COURSE_LEVEL_LABEL[course] ?? course;
  const cityLabel = prettyCity(city);

  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "by-course-city", course, city],
    queryFn: () => listScholarships({ level: course, city: cityLabel, limit: 60 }),
  });

  const courseJsonLd =
    data && data.length > 0
      ? data.slice(0, 20).map((s) => ({
          "@context": "https://schema.org",
          "@type": "Course",
          name: s.course_offering?.course?.name ?? courseLabel,
          description: `Bolsa de ${courseLabel} em ${cityLabel} com desconto de ${s.discount_value}%.`,
          provider: {
            "@type": "EducationalOrganization",
            name: s.course_offering?.course?.institution?.trade_name ?? "Instituição parceira",
            address: {
              "@type": "PostalAddress",
              addressLocality: cityLabel,
              addressRegion: s.course_offering?.institution_unit?.state ?? undefined,
              addressCountry: "BR",
            },
          },
          offers: {
            "@type": "Offer",
            price: Number(s.price_with_scholarship ?? 0),
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: `${SITE}/bolsas/${s.id}`,
          },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: s.course_offering?.course?.modality === "EAD" ? "Online" : "Onsite",
            location: cityLabel,
          },
        }))
      : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {courseJsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:underline">Início</Link>
            <span className="mx-2">›</span>
            <Link to="/bolsas" className="hover:underline">Bolsas</Link>
            <span className="mx-2">›</span>
            <Link to="/bolsas/categoria/$level" params={{ level: course }} className="hover:underline">{courseLabel}</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground font-medium">{cityLabel}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">
            Bolsas de {courseLabel} em {cityLabel}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {data && data.length > 0
              ? `${data.length} ${data.length === 1 ? "bolsa disponível" : "bolsas disponíveis"} de ${courseLabel.toLowerCase()} em ${cityLabel}. A partir de ${formatBRL(Math.min(...data.map((d) => Number(d.price_with_scholarship ?? 0))))}.`
              : `Compare as melhores ofertas de ${courseLabel.toLowerCase()} em ${cityLabel}.`}
          </p>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((s) => <ScholarshipCard key={s.id} s={s} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <p className="font-semibold">Ainda não temos bolsas de {courseLabel} em {cityLabel}.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link to="/bolsas/categoria/$level" params={{ level: course }} className="rounded-full bg-secondary px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
                Ver todas em {courseLabel}
              </Link>
              <Link to="/bolsas/cidade/$city" params={{ city }} className="rounded-full bg-secondary px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
                Ver todas em {cityLabel}
              </Link>
            </div>
          </div>
        )}

        <section className="mt-12 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-extrabold">Outras modalidades em {cityLabel}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== course).slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                to="/bolsas/curso/$course/cidade/$city"
                params={{ course: c.slug, city }}
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
