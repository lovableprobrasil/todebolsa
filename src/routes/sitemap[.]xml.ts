import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://todebolsa.lovable.app";

const LEVELS = [
  "fundamental",
  "medio",
  "tecnico",
  "graduacao",
  "pos-graduacao",
  "mba",
  "idiomas",
  "preparatorios",
  "extensao",
];

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function citySlug(c: string) {
  return c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/bolsas", changefreq: "daily", priority: "0.9" },
          { path: "/guia", changefreq: "weekly", priority: "0.7" },
          { path: "/carteira-uge", changefreq: "monthly", priority: "0.8" },
          { path: "/para-instituicoes", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
          { path: "/cookies", changefreq: "yearly", priority: "0.3" },
        ];

        for (const l of LEVELS) {
          entries.push({
            path: `/bolsas/categoria/${l}`,
            changefreq: "weekly",
            priority: "0.7",
          });
        }

        try {
          const { data: scholarships } = await supabase
            .from("scholarships")
            .select("id, updated_at")
            .eq("is_active", true)
            .limit(5000);
          for (const s of scholarships ?? []) {
            entries.push({
              path: `/bolsas/${s.id}`,
              lastmod: s.updated_at ? new Date(s.updated_at).toISOString().slice(0, 10) : undefined,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        } catch {
          /* ignore */
        }

        try {
          const { data: institutions } = await supabase
            .from("institutions")
            .select("slug, updated_at")
            .eq("status", "APPROVED")
            .limit(5000);
          for (const i of institutions ?? []) {
            if (!i.slug) continue;
            entries.push({
              path: `/instituicoes/${i.slug}`,
              lastmod: i.updated_at ? new Date(i.updated_at).toISOString().slice(0, 10) : undefined,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        } catch {
          /* ignore */
        }

        let citySlugs: string[] = [];
        try {
          const { data: units } = await supabase
            .from("institution_units")
            .select("city")
            .limit(5000);
          citySlugs = Array.from(
            new Set((units ?? []).map((u) => u.city).filter(Boolean) as string[]),
          ).map(citySlug);
          for (const c of citySlugs) {
            entries.push({
              path: `/bolsas/cidade/${c}`,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        } catch {
          /* ignore */
        }

        // Programmatic combo pages: /bolsas/curso/:level/cidade/:city
        const ENUM_LEVELS = [
          "FUNDAMENTAL","MEDIO","TECNICO","IDIOMAS","PROFISSIONALIZANTE",
          "CURSO_LIVRE","PREPARATORIO","EJA","PRE_VESTIBULAR",
          "GRADUACAO","POS_GRADUACAO","MBA","MESTRADO",
        ];
        for (const l of ENUM_LEVELS) {
          for (const c of citySlugs.slice(0, 50)) {
            entries.push({
              path: `/bolsas/curso/${l}/cidade/${c}`,
              changefreq: "weekly",
              priority: "0.5",
            });
          }
        }

        try {
          const { data: posts } = await supabase
            .from("blog_posts")
            .select("slug, updated_at")
            .eq("is_published", true)
            .limit(1000);
          for (const p of posts ?? []) {
            entries.push({
              path: `/guia/${p.slug}`,
              lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
              changefreq: "monthly",
              priority: "0.6",
            });
          }
        } catch {
          /* ignore */
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

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
