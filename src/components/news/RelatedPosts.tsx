import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  currentSlug: string;
  category: string | null;
}

export function RelatedPosts({ currentSlug, category }: Props) {
  const { data = [] } = useQuery({
    queryKey: ["related-posts", currentSlug, category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("slug, title, cover_url, excerpt, published_at")
        .eq("is_published", true)
        .neq("slug", currentSlug)
        .order("published_at", { ascending: false })
        .limit(3);

      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) return [];
      return data ?? [];
    },
  });

  if (data.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-bold mb-4">Leia também</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <Link
            key={p.slug}
            to="/guia/$slug"
            params={{ slug: p.slug }}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
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
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-soft to-accent/20">
                  <BookOpen className="h-8 w-8 text-primary/40" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold text-sm leading-snug group-hover:text-primary line-clamp-2">
                {p.title}
              </h3>
              {p.excerpt && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
