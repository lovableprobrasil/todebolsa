import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://todebolsa.lovable.app";

const STATIC_PATHS = [
  "/",
  "/bolsas",
  "/para-instituicoes",
];

const LEVELS = [
  "fundamental", "medio", "tecnico", "graduacao", "pos-graduacao",
  "mba", "idiomas", "preparatorios", "extensao",
];

export const Route = createFileRoute("/api/public/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const sb = url && key ? createClient(url, key) : null;

        const urls: string[] = [];

        for (const p of STATIC_PATHS) {
          urls.push(`<url><loc>${SITE}${p}</loc><changefreq>daily</changefreq><priority>${p === "/" ? "1.0" : "0.8"}</priority></url>`);
        }
        for (const l of LEVELS) {
          urls.push(`<url><loc>${SITE}/bolsas/categoria/${l}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
        }

        if (sb) {
          const { data: insts } = await sb.from("institutions").select("slug, updated_at").eq("status", "APPROVED").limit(1000);
          for (const i of insts ?? []) {
            urls.push(`<url><loc>${SITE}/instituicoes/${i.slug}</loc><lastmod>${(i.updated_at ?? "").slice(0, 10)}</lastmod><priority>0.6</priority></url>`);
          }
          const { data: cities } = await sb.from("institution_units").select("city").limit(2000);
          const uniqCities = Array.from(new Set((cities ?? []).map((c) => c.city).filter(Boolean)));
          for (const c of uniqCities) {
            const slug = encodeURIComponent(c.toLowerCase().replace(/\s+/g, "-"));
            urls.push(`<url><loc>${SITE}/bolsas/cidade/${slug}</loc><priority>0.6</priority></url>`);
          }
          const { data: posts } = await sb.from("blog_posts").select("slug, updated_at").eq("is_published", true).limit(500);
          for (const p of posts ?? []) {
            urls.push(`<url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${(p.updated_at ?? "").slice(0, 10)}</lastmod><priority>0.5</priority></url>`);
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
