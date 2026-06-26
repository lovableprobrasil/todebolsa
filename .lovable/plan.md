# Fluxo de Compra de Bolsas — Checkout Marketplace

Reformulação do fluxo atual (`/reservas/$id`) em um **checkout de 4 etapas** inspirado em marketplaces educacionais, sem quebrar reservas, cartas de apresentação, pricing rules e painel admin já existentes.

## Estado atual (o que já existe)
- `reservations` + `pay_reservation` (pagamento simulado R$ 59,90).
- `scholarship_letters` + `issue_scholarship_letter` (emitida após pagamento).
- `marketplace_pricing_rules` com hierarquia global/instituição/curso/bolsa.
- Auth Supabase (email/senha), `profiles`, `user_roles`.
- Validação de CEP (`lookupCep`), CPF, `PasswordInput`.
- E-mails transacionais (fila pgmq, templates React Email).
- Stripe **não habilitado** (decisão anterior pendente). Vou manter pagamento simulado nesta entrega e deixar arquitetura pronta para Stripe/Pix/Boleto reais depois.

## Escopo desta entrega (Entrega 1 — Checkout Core)

### Backend (1 migração)
1. **`checkout_sessions`** — guarda progresso do checkout (logado ou anônimo via token), bolsa escolhida, dados pessoais, endereço, etapa atual, UTMs, expira em 7 dias. RLS: dono (auth.uid) OU `session_token` (acesso anônimo via RPC).
2. **`checkout_acceptances`** — registro legal de cada aceite (termos, privacidade, condições da bolsa, contrato). Campos: user_id/lead_email, term_version, ip, user_agent, accepted_at, checkout_session_id.
3. **`checkout_events`** — eventos de funil (view, start, fill_data, accept_terms, review, payment_init, payment_confirmed, abandoned). Para analytics.
4. **Extensão `reservations`**: adicionar `checkout_session_id`, `payment_method` (PIX/BOLETO/CARD), `installments`, `utm_*`.
5. **Extensão `marketplace_pricing_rules`**: campos `allow_pix`, `allow_boleto`, `allow_card`, `max_installments`, `min_installment_amount`, `interest_rate_pct`, `pix_expiration_minutes`, `boleto_due_days`, `reserve_before_payment`, `reservation_ttl_minutes`.
6. **RPCs**:
   - `checkout_start(scholarship_id, session_token)` — cria/retoma sessão.
   - `checkout_save_step(session_id, step, payload)` — persiste progresso por etapa.
   - `checkout_check_existing_account(email, cpf, phone)` — retorna `{exists, suggest_login}` sem vazar dados.
   - `checkout_finalize(session_id, payment_method)` — cria user (se necessário via server fn admin), cria reservation, registra aceites, emite carta na confirmação.

### Server functions (`src/lib/checkout.functions.ts`)
- `startCheckout`, `saveCheckoutStep`, `checkExistingAccount`, `finalizeCheckout`, `getCheckoutSession`.
- Função admin (server-side) para criar conta confirmada pós-pagamento, reaproveitando padrão de `institution-application.ts`.

### Frontend
Nova rota `src/routes/checkout.$scholarshipId.tsx` com 4 etapas internas (state machine, sem mudar URL para preservar dados):

```text
┌──────────────────────────────────────────────────────┐
│ [1 Dados] → [2 Bolsa+Termos] → [3 Revisão] → [4 Pag] │
└──────────────────────────────────────────────────────┘
```

**Etapa 1 — Dados**: nome, CPF, telefone, WhatsApp, email + confirmação, senha + confirmação (oculta se já logado), CEP com auto-preenchimento, endereço. Verificação on-blur de conta existente → modal "Entrar e continuar".

**Etapa 2 — Bolsa + Aceites**: card visual da bolsa (instituição, curso, valor original, desconto, valor com bolsa, taxa de adesão Tô de Bolsa, validade, vagas, regras). 4 checkboxes obrigatórios (termos, privacidade, condições, contrato) com links em modal/nova aba.

**Etapa 3 — Revisão**: resumo de dados pessoais + endereço + bolsa + aceites com botões "Editar" por seção. Sidebar fixa com total (desktop) / collapse (mobile).

**Etapa 4 — Pagamento**: tabs Pix / Boleto / Cartão (filtradas pelas regras da bolsa). Pix mostra QR placeholder + copia-cola. Boleto mostra linha digitável + botão baixar. Cartão tem form com parcelas dinâmicas baseadas em `max_installments` e `min_installment_amount`. **Nesta entrega o pagamento continua simulado** (`pay_reservation`), mas o seletor de método e parcelas é real.

**Tela de sucesso**: já existe (`/reservas/$id` em estado PAID com botão "Baixar Carta de Apresentação"); vou ajustar para incluir mensagem "Parabéns!", próximos passos, número do pedido.

### Painel admin
Adicionar aba "Regras de pagamento" em `/admin/configuracoes-comerciais` (já existe a rota): editar campos novos de `marketplace_pricing_rules` por escopo (global/instituição/curso/bolsa).

### Componentes novos
- `CheckoutStepper` (barra de progresso).
- `CheckoutSummary` (sidebar com bolsa).
- `ScholarshipDetailsCard` (etapa 2).
- `AcceptanceCheckbox` (etapa 2).
- `PaymentMethodTabs` + `PixPanel`, `BoletoPanel`, `CardPanel`.
- `ExistingAccountModal`.

### Analytics
`trackEvent` já existe (`src/lib/analytics.ts`). Disparar em cada transição do stepper.

### Recuperação de checkout abandonado
- `checkout_sessions.updated_at` + `status='ABANDONED'` via cron diário (já temos pg_cron para emails).
- Link de retomada: `/checkout/retomar?token={session_token}` carrega sessão e pula para `current_step`.
- Email de recuperação após 24h (template novo `checkout-abandoned`).

## Fora desta entrega (próximas)
- **Stripe real** (Pix/cartão via Stripe Brasil) — depende decisão pendente.
- **Boleto real** — depende provedor (Stripe Brasil ainda não suporta boleto bem; alternativa: Asaas/PagarMe).
- **Tracking GA4/Meta Pixel** — só estrutura de eventos nesta entrega.
- **CRM/WhatsApp** — depende connector.

## Compatibilidade
- Fluxo antigo `/reservas/$id` continua funcionando (rota mantida).
- Botão "Quero esta bolsa" passa a apontar para `/checkout/$scholarshipId` em vez de criar reservation direto.
- `reservations`, `scholarship_letters`, painel admin, notificações, documentos: **intactos**.

## Confirmar antes de seguir
1. **Pagamento real (Stripe/Pix)**: mantenho simulado nesta entrega (PR já gigante), Stripe entra em entrega seguinte — OK?
2. **Boleto**: só UI nesta entrega (gera placeholder), integração real fica para quando definirmos provedor — OK?
3. **Criar conta**: na confirmação do pagamento (não antes), conforme item 8 do prompt — OK?
4. **Recuperação por email**: 24h após abandono — OK?

Se sim, implemento a **Entrega 1** no próximo turno.
