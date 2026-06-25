import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://todebolsa.com.br";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
        );

        const { data } = await supabase
          .from("blog_posts")
          .select("slug, title, excerpt, author, published_at, cover_url, category")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(30);

        const items = (data ?? [])
          .map((p) => {
            const url = `${BASE_URL}/guia/${p.slug}`;
            const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString();
            return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${p.author ? `<author>noreply@todebolsa.com.br (${escapeXml(p.author)})</author>` : ""}
      ${p.category ? `<category>${escapeXml(p.category)}</category>` : ""}
      <description>${escapeXml(p.excerpt ?? "")}</description>
      ${p.cover_url ? `<enclosure url="${escapeXml(p.cover_url)}" type="image/jpeg" />` : ""}
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tô de Bolsa — Guia do Estudante</title>
    <link>${BASE_URL}/guia</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Notícias, dicas e novidades sobre bolsas de estudo, ENEM, FIES e ProUni.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
