import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = process.env.AI_TEXT_MODEL || "google/gemini-2.5-flash";
const IMAGE_MODEL = process.env.AI_IMAGE_MODEL || "google/gemini-2.5-flash-image-preview";

function getApiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY não configurada no servidor.");
  return key;
}

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("PLATFORM_ADMIN")) {
    throw new Error("Apenas administradores podem usar este recurso.");
  }
}

async function callChat(body: any) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace Lovable.");
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erro IA (${res.status}): ${txt.slice(0, 240)}`);
  }
  return res.json();
}

function tryParseJson<T>(raw: string): T | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // try to extract first {...}
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const ARTICLE_SCHEMA_HINT = `Responda APENAS com JSON válido no formato:
{
  "title": "string",
  "subtitle": "string",
  "excerpt": "string curto (até 220 chars)",
  "slug": "kebab-case-pt-br",
  "content_html": "HTML semântico com <h2>, <h3>, <p>, <ul>, <strong>. Sem <html>/<body>.",
  "category": "string curta (ex.: Bolsas, Carreira, Mercado, Educação)",
  "tags": ["string"],
  "meta_title": "até 60 chars",
  "meta_description": "até 160 chars",
  "main_keyword": "string",
  "secondary_keywords": ["string"],
  "social_caption": "chamada para redes sociais (até 240 chars)",
  "image_prompt": "prompt em português para gerar imagem editorial",
  "image_alt": "alt-text da imagem",
  "warnings": ["alertas de fatos a verificar"]
}`;

// ============= GENERATE ARTICLE =============
export const aiGenerateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      topic: z.string().min(2),
      briefing: z.string().optional(),
      referenceText: z.string().optional(),
      referenceUrl: z.string().url().optional().or(z.literal("")),
      audience: z.string().optional(),
      tone: z.string().optional(),
      category: z.string().optional(),
      mainKeyword: z.string().optional(),
      secondaryKeywords: z.array(z.string()).optional(),
      length: z.enum(["curta", "media", "completa", "aprofundada"]).default("media"),
      objective: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);

    const lengthMap = {
      curta: "350-500 palavras",
      media: "600-900 palavras",
      completa: "1000-1400 palavras",
      aprofundada: "1500-2200 palavras",
    } as const;

    const system = `Você é um redator editorial sênior do portal Tô de Bolsa (marketplace brasileiro de bolsas de estudo).
Escreva em português do Brasil, tom ${data.tone ?? "profissional, claro, educacional, confiável"}.
Público: ${data.audience ?? "estudantes brasileiros e suas famílias"}.
Objetivo: ${data.objective ?? "informar e atrair tráfego orgânico"}.
NÃO invente estatísticas, leis, nomes de instituições ou rankings. Quando houver incerteza, sinalize no campo "warnings".
NÃO copie literalmente trechos de fontes externas — reescreva com linguagem própria.
NÃO use emojis. NÃO faça promessas absolutas.`;

    const userParts: string[] = [];
    userParts.push(`Tema / título base: ${data.topic}`);
    if (data.briefing) userParts.push(`Briefing: ${data.briefing}`);
    if (data.referenceUrl) userParts.push(`Fonte de referência (apenas inspiração): ${data.referenceUrl}`);
    if (data.referenceText) userParts.push(`Texto de referência (NÃO copiar literalmente):\n${data.referenceText.slice(0, 6000)}`);
    if (data.category) userParts.push(`Categoria sugerida: ${data.category}`);
    if (data.mainKeyword) userParts.push(`Palavra-chave principal: ${data.mainKeyword}`);
    if (data.secondaryKeywords?.length) userParts.push(`Palavras-chave secundárias: ${data.secondaryKeywords.join(", ")}`);
    userParts.push(`Tamanho do conteúdo: ${lengthMap[data.length]}`);
    userParts.push(ARTICLE_SCHEMA_HINT);

    const json = await callChat({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n\n") },
      ],
      temperature: 0.7,
    });

    const raw = json?.choices?.[0]?.message?.content ?? "";
    const parsed = tryParseJson<any>(raw);
    if (!parsed) throw new Error("A IA não retornou JSON válido. Tente novamente.");

    // log generation
    await context.supabase.from("news_ai_generations").insert({
      user_id: context.userId,
      generation_type: "article",
      input_payload: data,
      output_payload: parsed,
      model_provider: TEXT_MODEL,
    });

    return parsed;
  });

// ============= EXTRACT URL =============
export const aiExtractUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TodeBolsaBot/1.0; +https://todebolsa.com.br)",
        },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const html = await res.text();
      // crude text extraction
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch =
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) ||
        html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
      return {
        ok: true as const,
        title: titleMatch?.[1]?.trim() ?? null,
        description: descMatch?.[1]?.trim() ?? null,
        text,
      };
    } catch (err) {
      return {
        ok: false as const,
        message:
          "Não foi possível ler automaticamente essa URL. Cole um resumo ou trecho de referência para que a IA gere a notícia.",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

// ============= GENERATE IMAGE =============
const ASPECTS: Record<string, { w: number; h: number; bucketDir: string }> = {
  "16:9": { w: 1536, h: 864, bucketDir: "cover" },
  "1:1": { w: 1024, h: 1024, bucketDir: "square" },
  "9:16": { w: 720, h: 1280, bucketDir: "vertical" },
  "1200x630": { w: 1200, h: 630, bucketDir: "og" },
};

export const aiGenerateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      prompt: z.string().min(5),
      style: z.string().optional(),
      aspect: z.enum(["16:9", "1:1", "9:16", "1200x630"]).default("16:9"),
      imageType: z.enum(["cover", "thumbnail", "og", "internal", "social"]).default("cover"),
      articleId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);
    const aspect = ASPECTS[data.aspect];

    const stylePrefix =
      data.style ||
      "Imagem editorial moderna brasileira, educacional, limpa, positiva, cores alinhadas a uma marca jovem (laranja vibrante + azul-escuro)";
    const safety =
      "Sem logotipos de terceiros. Sem marcas reais. Sem pessoas famosas. Sem texto ilegível dentro da imagem. Sem documentos oficiais. Composição " +
      data.aspect +
      ".";

    const fullPrompt = `${stylePrefix}. ${data.prompt}. ${safety}`;

    const json = await callChat({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: fullPrompt }],
      modalities: ["image", "text"],
    });

    const msg = json?.choices?.[0]?.message;
    const imgUrl: string | undefined =
      msg?.images?.[0]?.image_url?.url || msg?.images?.[0]?.url;
    if (!imgUrl) throw new Error("IA não retornou imagem. Tente reformular o prompt.");

    // imgUrl is data:image/png;base64,...
    const match = imgUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) throw new Error("Formato de imagem inesperado.");
    const mime = match[1];
    const ext = mime.split("/")[1].replace("+xml", "");
    const bytes = Buffer.from(match[2], "base64");

    const path = `${aspect.bucketDir}/${context.userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const up = await context.supabase.storage.from("news-images").upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (up.error) throw new Error(up.error.message);

    // signed URL valid for 10 years (private bucket)
    const signed = await context.supabase.storage
      .from("news-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed.error) throw new Error(signed.error.message);
    const finalUrl = signed.data.signedUrl;

    const inserted = await context.supabase
      .from("news_images")
      .insert({
        article_id: data.articleId ?? null,
        image_url: finalUrl,
        image_type: data.imageType,
        prompt: fullPrompt,
        style: data.style ?? null,
        aspect_ratio: data.aspect,
        selected: false,
        created_by: context.userId,
      })
      .select("id, image_url, image_type, aspect_ratio")
      .maybeSingle();

    await context.supabase.from("news_ai_generations").insert({
      article_id: data.articleId ?? null,
      user_id: context.userId,
      generation_type: "image",
      input_payload: { prompt: data.prompt, style: data.style, aspect: data.aspect },
      output_payload: { storage_path: path, image_id: inserted.data?.id },
      model_provider: IMAGE_MODEL,
    });

    return {
      id: inserted.data?.id as string | undefined,
      url: finalUrl,
      imageType: data.imageType,
      aspect: data.aspect,
    };
  });

// ============= REWRITE / IMPROVE TEXT =============
export const aiRewriteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(10),
      mode: z.enum(["improve", "rewrite", "shorten", "expand", "seo"]).default("improve"),
    }),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context as any);
    const instr: Record<string, string> = {
      improve: "Melhore a clareza, fluidez e correção, mantendo o sentido e o HTML.",
      rewrite: "Reescreva com nova estrutura mantendo o sentido. Preserve tags HTML.",
      shorten: "Reduza em ~30% mantendo as informações essenciais. Preserve HTML.",
      expand: "Aprofunde com exemplos e contexto. Preserve HTML.",
      seo: "Otimize para SEO: intertítulos, palavras-chave naturais, primeiro parágrafo forte. Preserve HTML.",
    };
    const json = await callChat({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Você é editor sênior do Tô de Bolsa. Português do Brasil. Sem inventar fatos. Responda apenas com o HTML reescrito.",
        },
        { role: "user", content: `${instr[data.mode]}\n\n---\n${data.text}` },
      ],
      temperature: 0.6,
    });
    const html = json?.choices?.[0]?.message?.content ?? "";
    return { html };
  });
