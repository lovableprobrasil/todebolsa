import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://todebolsa.lovable.app";

export const Route = createFileRoute("/guia/")({
  head: () => {
    const title = "Guia do Estudante — Bolsas, ENEM, FIES e dicas | Tô de Bolsa";
    const desc =
      "Tudo o que você precisa saber sobre bolsas de estudo, FIES, ProUni, ENEM e como economizar nos estudos. Conteúdo escrito por especialistas.";
    const url = `${SITE}/guia`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Guia do Estudante — Tô de Bolsa",
            description: desc,
            url,
            publisher: { "@type": "Organization", name: "Tô de Bolsa" },
          }),
        },
      ],
    };
  },
  component: GuiaIndex,
});

function GuiaIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_url, author, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:underline">Início</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground font-medium">Guia do Estudante</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary mb-3">
            <BookOpen className="h-3.5 w-3.5" /> Guia do Estudante
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">
            Tudo sobre bolsas, ENEM, FIES e como economizar nos estudos
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Conteúdo prático para quem quer estudar pagando menos. Escrito pelo time do Tô de Bolsa.
          </p>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[340px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <Link
                key={p.slug}
                to="/guia/$slug"
                params={{ slug: p.slug }}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-accent/20 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    {p.published_at && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(p.published_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:gap-2 transition-all">
                      Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">Em breve, novos artigos por aqui.</p>
            <Link to="/bolsas" className="text-primary text-sm hover:underline mt-2 inline-block">
              Enquanto isso, veja nossas bolsas →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
