import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://todebolsa.lovable.app";

type Category = { slug: string; name: string; description: string | null; color: string | null };
type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  author: string | null;
  published_at: string | null;
};

function categoryQuery(slug: string) {
  return queryOptions({
    queryKey: ["news-category", slug],
    queryFn: async () => {
      const { data: cat, error } = await supabase
        .from("news_categories")
        .select("slug, name, description, color")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!cat) throw notFound();
      const { data: posts, error: pErr } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_url, author, published_at, category")
        .eq("is_published", true)
        .ilike("category", cat.name)
        .order("published_at", { ascending: false });
      if (pErr) throw pErr;
      return { category: cat as Category, posts: (posts ?? []) as Post[] };
    },
    staleTime: 5 * 60_000,
  });
}

export const Route = createFileRoute("/guia/categoria/$slug")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(categoryQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const cat = (loaderData as any)?.category as Category | undefined;
    const title = cat
      ? `${cat.name} — Notícias e guias | Tô de Bolsa`
      : "Categoria | Tô de Bolsa";
    const desc =
      cat?.description ?? "Conteúdo organizado por categoria no Guia do Estudante Tô de Bolsa.";
    const url = `${SITE}/guia/categoria/${params.slug}`;
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
    };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-destructive">{error.message}</p>
        <Link to="/guia" className="text-primary hover:underline mt-3 inline-block">
          ← Voltar para o Guia
        </Link>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">Categoria não encontrada</h1>
        <Link to="/guia" className="text-primary hover:underline mt-3 inline-block">
          ← Voltar para o Guia
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  const { category, posts } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div
        className="border-b border-border"
        style={{
          background: `linear-gradient(180deg, ${category.color ?? "#F97316"}15, transparent)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:underline">Início</Link>
            <span className="mx-2">›</span>
            <Link to="/guia" className="hover:underline">Guia</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground font-medium">{category.name}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>
          )}
          <Link
            to="/guia"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Todas as categorias
          </Link>
        </div>
      </div>
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">Em breve, novos conteúdos nesta categoria.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
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
                      decoding="async"
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
        )}
      </main>
      <Footer />
    </div>
  );
}
