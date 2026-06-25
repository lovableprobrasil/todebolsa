import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function BlogHomeSection() {
  const { data } = useQuery({
    queryKey: ["home-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_url, author, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const posts = data ?? [];
  if (!posts.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Newspaper className="h-3.5 w-3.5" /> Blog Tô de Bolsa
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">
            Notícias, dicas e informações para sua carreira
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Fique por dentro do mercado de trabalho, certificações técnicas e tudo sobre bolsas de estudo.
          </p>
        </div>
        <Link
          to="/guia"
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  <Newspaper className="h-10 w-10 text-primary/40" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {p.title}
              </h3>
              {p.excerpt && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>
              )}
              {p.published_at && (
                <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(p.published_at).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
