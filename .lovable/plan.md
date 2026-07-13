A demanda é grande e toca muitas áreas (design system, header, hero, busca, cards, página de resultados, validações, analytics). Para entregar com qualidade sem quebrar funcionalidades existentes, proponho executar em fases — cada fase é entregável, testável e reversível. Preciso da sua confirmação antes de começar, e da escolha de por onde iniciar.

## Fase 1 — Novo Design System (base para tudo)
- Atualizar `src/styles.css` com a nova paleta (navy #102A43, primary turquesa #00766F, highlight #F5B942, success, danger, background #F6F8FB, borders, textos).
- Trocar tipografia para Manrope (títulos) + Inter (corpo) via `<link>` no `__root.tsx`.
- Definir escala tipográfica (H1/H2/H3, preço) como utilitários/tokens.
- Ajustar componentes base shadcn (Button, Card, Badge, Input) para refletir a nova paleta sem quebrar variantes existentes.
- Remover gradientes pesados do hero atual e sombras exageradas.

## Fase 2 — Header
- Reorganizar navegação: Buscar bolsas, Instituições parceiras, Como funciona, Guia do estudante, Para instituições, Entrar, Criar conta.
- Header branco, compacto, fixo no scroll (desktop). Menu lateral acessível no mobile com CTA “Buscar bolsas” visível.
- Separar claramente “Instituições parceiras” (estudantes) de “Para instituições” (B2B).

## Fase 3 — Hero + Busca
- Reduzir para 3 slides ativos com os títulos e CTAs solicitados.
- Card de busca fixo sobreposto ao banner (curso, cidade, modalidade, nível) com labels visíveis; não perde dados entre slides; pausa no hover/foco/digitação; botão pausar/iniciar; setas + indicadores; swipe; respeita reduced-motion.
- Substituir imagens por fotos de estudantes brasileiros diversos (gerar 3 novas). Remover carteira com logos de terceiros.
- Faixa de confiança discreta logo abaixo com 4 selos (sem promessas absolutas).

## Fase 4 — Homepage: reorganizar seções
Ordem: Header → Hero+Busca → Instituições parceiras → Categorias → Bolsas em destaque → Como funciona → Carteira UGE → Avaliações → Bolsas por cidade → Para instituições → FAQ → Rodapé. Alternar fundos branco/cinza.

## Fase 5 — Cards de bolsa
- Redesenhar `ScholarshipCard` no novo padrão: “De R$ X · Por R$ Y/mês · Economize R$ Z · 60% de desconto” (sem “−60% OFF”).
- Preço promocional com maior destaque que o percentual.
- Texto discreto “Consulte as condições e regras de manutenção da bolsa.”
- Selo amarelo apenas quando aplicável.

## Fase 6 — Página de resultados `/bolsas`
- Busca compacta no topo, contagem de resultados, chips de filtros ativos, botão limpar, ordenação.
- Sidebar fixa no desktop, drawer no mobile com contador de filtros ativos.
- Estados: loading (skeletons), vazio, erro, últimas vagas, curso novo, encerrada.

## Fase 7 — Validações de oferta (admin/instituição)
- Bloquear preço negativo, desconto >100%, alertar >90%, exigir original > promocional.
- Campos explícitos para periodicidade (mensal/total/semestral/parcelado) e diferenciar mensalidade × taxa × matrícula.
- Não calcular economia anual quando duração/periodicidade não confirmadas.

## Fase 8 — Como funciona + Carteira UGE
- 3 passos de descoberta (Encontre / Compare / Garanta) separados dos 4 passos do checkout (Dados / Detalhes / Pagamento / Revisão).
- Seção UGE reescrita: elegibilidade, cursos, emissão, validade, documentos. Remover “garantida” quando houver condicionantes.

## Fase 9 — Acessibilidade, performance e analytics
- Focus ring, ARIA no carrossel, labels, alt texts, contraste AA.
- WebP/AVIF, width/height, lazy-loading, skeletons.
- Eventos via `trackEvent` já existente: banner view, troca manual, uso da busca, categoria, instituição, bolsa, filtro, cadastro, pagamento, compra.

## Detalhes técnicos
- Preservar rotas, integrações Supabase, checkout Stripe, RLS, server functions.
- Sem alterações no schema do banco. Validações Fase 7 são client-side + server function existente (não migrations novas neste plano).
- Componentes reutilizáveis em `src/components/site/` e `src/components/ui/` (variantes shadcn).
- Nenhum dado inventado: instituições, avaliações, vagas e preços continuam vindo do banco.

## O que preciso de você
1. Confirma a ordem das fases acima?
2. Posso começar pela **Fase 1 (Design System) + Fase 2 (Header) + Fase 3 (Hero/Busca)** em uma primeira entrega — é a base visível e destrava as demais? Ou prefere outra ordem?
3. As Fases 5–7 (cards, resultados, validações) podem ficar para uma segunda rodada, depois que você aprovar o novo visual?
