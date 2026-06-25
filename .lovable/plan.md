# Fase 3 — Distribuição, Engajamento e Analytics

Foco: depois de criar e publicar (Fases 1 e 2), agora o objetivo é **fazer a notícia chegar ao leitor, gerar interação e medir resultado**.

## 1. SEO e descoberta avançada

- **RSS Feed** em `/guia/rss.xml` com últimas 30 notícias (server route público).
- **Sitemap dedicado** `/news-sitemap.xml` no padrão Google News (notícias dos últimos 2 dias com `<news:news>`).
- **JSON-LD `NewsArticle`** na página `/guia/$slug` (hoje só temos OG básico) com `author`, `datePublished`, `dateModified`, `publisher`, `image`.
- **Posts relacionados** ao final do artigo (mesma categoria/tag, 3 cards).
- **Breadcrumb** com schema `BreadcrumbList`.

## 2. Engajamento do leitor

- **Contador de visualizações** (`view_count` em `blog_posts`) incrementado por RPC pública com throttle por sessão.
- **Tempo de leitura** calculado e exibido (já temos `reading_time_minutes`, garantir cálculo automático no save).
- **Botões de compartilhamento** (WhatsApp, X, LinkedIn, copiar link) com tracking.
- **Newsletter inline**: bloco "Receba novidades" no final do post grava em `leads` com origem = `newsletter_news`.

## 3. Analytics editorial no admin

- Nova aba **"Desempenho"** em `/admin/blog` mostrando, por post: views, compartilhamentos, tempo médio, taxa de conversão para newsletter.
- Dashboard agregado em `/admin/blog` (topo): top 5 posts da semana, total de views, novos leads via newsletter.
- Eventos gravados em `analytics_events` (já existe) com `event_type` = `news_view`, `news_share`, `news_newsletter_signup`.

## 4. Página `/guia` reformulada

- Hero com **destaque editorial** (post marcado como `is_featured`).
- Seção "Mais lidos da semana" (ordem por views dos últimos 7 dias).
- Mantém grid atual de categorias e listagem cronológica.

## Estrutura técnica

```text
src/routes/api/public/
  rss.xml.ts                  → RSS feed
  news-sitemap.xml.ts         → Google News sitemap
  news.track-view.ts          → POST p/ incrementar views

src/lib/
  news-analytics.functions.ts → server fns (top posts, métricas)

src/components/news/
  ShareButtons.tsx
  NewsletterInline.tsx
  RelatedPosts.tsx
  Breadcrumbs.tsx

Migração SQL:
  - blog_posts.view_count, share_count, is_featured
  - RPC public increment_news_view(post_id, session_hash)
  - índice em (status, published_at desc) p/ feed
```

## Fora do escopo desta fase

- Comentários de leitores (requer moderação dedicada → fase futura).
- Push notifications / e-mail blast real (depende de provedor SMTP).
- A/B test de manchetes.

Posso começar pela migração SQL + RSS/sitemap, depois UI de engajamento, e fechar com o painel de desempenho. Confirma?
