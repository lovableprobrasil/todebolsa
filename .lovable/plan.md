
# Módulo de Notícias com IA — Plano de Implementação

O escopo descrito é grande (CMS completo + IA de texto + IA de imagem + SEO + agendamento + workflow). Vou entregar em **3 fases**, cada uma testável de forma independente. Começo pela Fase 1 (MVP) assim que aprovar.

---

## Stack e decisões técnicas

- **IA de texto:** Lovable AI Gateway com `google/gemini-3-flash-preview` (já configurado, sem chave extra).
- **IA de imagem:** Lovable AI Gateway com `google/gemini-3.1-flash-image` (Nano Banana 2) para capa/thumb/OG.
- **Backend:** server functions TanStack (`createServerFn`) sob `src/lib/news.functions.ts`.
- **Storage de imagens:** bucket público `news-images` no Lovable Cloud.
- **Extração de URL:** `fetch` no servidor + extração simples de `<title>`, `<meta description>`, `<article>`/`<p>` (sem dependência nova).
- **Base de dados:** estendo `blog_posts` existente (já em uso em `/guia`) com novos campos em vez de criar `news_articles` paralela — evita duplicação de catálogo e mantém `/guia` e `/admin/blog` funcionando. Adiciono tabelas auxiliares `news_ai_generations` e `news_images`.

---

## Fase 1 — MVP (esta entrega)

**Backend / DB**
- Migração estendendo `blog_posts`: `subtitle`, `category`, `tags[]`, `meta_title`, `meta_description`, `main_keyword`, `secondary_keywords[]`, `thumbnail_url`, `og_image_url`, `image_alt`, `image_credit`, `source_url`, `source_name`, `status` (`DRAFT|IN_REVIEW|SCHEDULED|PUBLISHED|ARCHIVED`), `scheduled_at`, `featured`, `ai_generated`, `ai_warnings`.
- Novas tabelas `news_ai_generations` e `news_images` (com RLS: admin gerencia).
- Bucket `news-images` (público) + policies.
- Server functions (admin-only via `requireSupabaseAuth` + `is_platform_admin`):
  - `aiGenerateArticle` — gera título/subtítulo/resumo/conteúdo HTML/SEO/prompt de imagem a partir de briefing/título/URL.
  - `aiExtractUrl` — busca a URL, extrai título+texto (limita a ~6KB) para servir de referência.
  - `aiGenerateImage` — chama o modelo de imagem, faz upload no bucket, registra em `news_images`, retorna URL.
  - `aiGenerateSeo` / `aiRewrite` / `aiGenerateSocial` — utilitários menores reutilizando o mesmo gateway.

**Admin UI (`/admin/blog` reformulado)**
- Editor em **abas**: Conteúdo · IA · Imagens · SEO · Publicação.
- Bloco "Gerar notícia com IA" (título + briefing + URL opcional + tom + tamanho + objetivo).
- Bloco "Gerar imagem com IA" com aspect ratios (16:9 capa, 1:1 thumb, 1200×630 OG) e botões "Usar como capa/thumb/OG".
- Status, agendar, destacar, checklist de publicação (bloqueia publicar se faltar título/slug/conteúdo/capa/meta description).
- Aviso "Conteúdo gerado por IA — revisar".

**Site público**
- `/guia` continua funcionando (compat). Adiciono redirects `/noticias` → `/guia` e `/noticias/$slug` → `/guia/$slug` para não duplicar URLs (o blog já está indexado lá). Posso inverter depois se preferir `/noticias` como canônico.
- Página da notícia ganha: subtítulo, tags, OG image dinâmica, CTAs (bolsas / carteira UGE / instituições), bloco "Notícias relacionadas" por categoria/tags.

**Limites do MVP (intencionais)**
- Sem histórico de versões, sem múltiplos autores, sem workflow multi-etapa de revisão.
- Agendamento grava `scheduled_at` + status `SCHEDULED`; publicação efetiva por cron fica para Fase 2.
- Galeria interna fica para Fase 2 (capa + thumb + OG já cobrem o essencial).

---

## Fase 2 — Automação e workflow
- Cron (`pg_cron` chamando `/api/public/news/publish-scheduled`) para publicar agendadas.
- Histórico de versões + restaurar.
- Geração de variações de imagem (2/4) e galeria interna.
- Geração de cards para redes sociais (1:1 e 9:16) com texto sobreposto opcional.
- Categorias como tabela própria + rotas `/guia/categoria/$slug` e `/guia/tag/$slug`.

## Fase 3 — Editorial avançado
- Workflow `DRAFT → IN_REVIEW → PUBLISHED` com aprovador.
- Múltiplos autores (roles `EDITOR`).
- FAQ estruturado + JSON-LD `Article` + `FAQPage`.
- Painel de performance por notícia (views, CTR de CTA) usando `analytics_events`.

---

## Pontos que preciso confirmar antes de codar

1. **URL canônica do blog:** mantenho `/guia` (já indexado) e faço `/noticias` redirecionar, ou prefere migrar tudo para `/noticias` (com 301 reverso)?
2. **Bucket público OK?** Imagens de capa/OG precisam ser públicas para `<meta og:image>` funcionar — confirmo bucket `news-images` público.
3. **Posso prosseguir direto com a Fase 1** ou quer ajustar algo no escopo do MVP?
