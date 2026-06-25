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

export const Route = createFileRoute("/news-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
        );

        const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("blog_posts")
          .select("slug, title, published_at")
          .eq("is_published", true)
          .gte("published_at", since)
          .order("published_at", { ascending: false })
          .limit(1000);

        const urls = (data ?? [])
          .map((p) => {
            const url = `${BASE_URL}/guia/${p.slug}`;
            return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>Tô de Bolsa</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${p.published_at}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
