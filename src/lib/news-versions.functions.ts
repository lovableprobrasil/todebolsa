import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("is_platform_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem usar este recurso.");
}

export const listPostVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ postId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);
    const { data: versions, error } = await context.supabase
      .from("news_post_versions")
      .select("id, version_number, title, subtitle, status, created_at, created_by, change_reason")
      .eq("post_id", data.postId)
      .order("version_number", { ascending: false });
    if (error) throw new Error(error.message);
    return versions ?? [];
  });

export const restorePostVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ postId: z.string().uuid(), versionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);
    const { data: ver, error } = await context.supabase
      .from("news_post_versions")
      .select("snapshot")
      .eq("id", data.versionId)
      .eq("post_id", data.postId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ver) throw new Error("Versão não encontrada.");

    const snap = ver.snapshot as Record<string, any>;
    const fields = [
      "title",
      "subtitle",
      "excerpt",
      "content",
      "cover_url",
      "thumbnail_url",
      "og_image_url",
      "image_alt",
      "image_credit",
      "category",
      "tags",
      "meta_title",
      "meta_description",
      "main_keyword",
      "secondary_keywords",
      "source_url",
      "source_name",
    ];
    const payload: Record<string, any> = {};
    for (const f of fields) if (f in snap) payload[f] = snap[f];
    // restoring keeps current status (don't auto-publish past version)
    const { error: upErr } = await (context.supabase.from("blog_posts") as any)
      .update(payload)
      .eq("id", data.postId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
