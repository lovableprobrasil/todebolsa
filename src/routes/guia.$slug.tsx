import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, User, ArrowLeft, BookOpen, Clock, Eye } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ShareButtons } from "@/components/news/ShareButtons";
import { NewsletterInline } from "@/components/news/NewsletterInline";
import { RelatedPosts } from "@/components/news/RelatedPosts";
import { ViewTracker } from "@/components/news/ViewTracker";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://todebolsa.com.br";

type Post = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  image_credit: string | null;
  category: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  source_url: string | null;
  source_name: string | null;
  author: string | null;
  published_at: string | null;
};

function postQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: async (): Promise<Post> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "slug, title, subtitle, excerpt, content, cover_url, thumbnail_url, og_image_url, image_alt, image_credit, category, tags, meta_title, meta_description, source_url, source_name, author, published_at",
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as Post;
    },
    staleTime: 5 * 60_000,
  });
}

export const Route = createFileRoute("/guia/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const post = loaderData as Post | undefined;
    const title = post ? `${post.meta_title || post.title} | Tô de Bolsa` : "Artigo | Tô de Bolsa";
    const desc = post?.meta_description ?? post?.excerpt ?? "Guia do Estudante — Tô de Bolsa.";
    const url = `${SITE}/guia/${params.slug}`;
    const ogImage = post?.og_image_url ?? post?.cover_url ?? null;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (ogImage) {
      meta.push({ property: "og:image", content: ogImage });
      meta.push({ name: "twitter:image", content: ogImage });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                description: desc,
                image: post.cover_url ?? undefined,
                datePublished: post.published_at ?? undefined,
                author: { "@type": "Person", name: post.author ?? "Equipe Tô de Bolsa" },
                publisher: {
                  "@type": "Organization",
                  name: "Tô de Bolsa",
                  url: SITE,
                },
                mainEntityOfPage: url,
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
                  { "@type": "ListItem", position: 2, name: "Guia", item: `${SITE}/guia` },
                  { "@type": "ListItem", position: 3, name: post.title, item: url },
                ],
              }),
            },
          ]
        : [],
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
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h1 className="font-display text-2xl font-extrabold">Artigo não encontrado</h1>
        <Link to="/guia" className="text-primary hover:underline mt-3 inline-block">
          ← Voltar para o Guia
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQueryOptions(slug));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <article className="flex-1">
        {post.cover_url && (
          <div className="w-full aspect-[21/9] bg-muted overflow-hidden">
            <img
              src={post.cover_url}
              alt={post.image_alt || post.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {post.image_credit && (
              <div className="text-[11px] text-muted-foreground text-right max-w-3xl mx-auto px-4 pt-1">
                {post.image_credit}
              </div>
            )}
          </div>
        )}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/guia" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> Guia do Estudante
          </Link>
          {post.category && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary mb-2">
              {post.category}
            </span>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-2 text-lg md:text-xl text-muted-foreground">{post.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            {post.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" /> {post.author}
              </span>
            )}
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {post.excerpt && (
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/40 pl-4">
              {post.excerpt}
            </p>
          )}

          {post.content && (
            <div
              className="prose prose-neutral max-w-none mt-8 prose-headings:font-display prose-headings:font-extrabold prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs rounded-full bg-muted px-3 py-1 text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {post.source_url && (
            <p className="mt-6 text-xs text-muted-foreground">
              Fonte:{" "}
              <a
                href={post.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {post.source_name || post.source_url}
              </a>
            </p>
          )}


          <div className="mt-12 rounded-2xl bg-primary-soft/40 border border-primary/20 p-6 text-center">
            <h2 className="font-display text-xl font-bold">Pronto para encontrar sua bolsa?</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Mais de 50 mil bolsas com até 90% de desconto esperando por você.
            </p>
            <Link
              to="/bolsas"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold hover:bg-primary/90"
            >
              Buscar bolsas
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
}
