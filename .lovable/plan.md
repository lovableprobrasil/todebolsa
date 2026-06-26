# Modelo Comercial — Taxa Única + Carta de Apresentação

Reestruturação do modelo de cobrança: o aluno paga uma **taxa única ao Tô de Bolsa** para reservar a bolsa e receber uma **Carta de Apresentação** que apresenta na instituição. Não há mensalidade nem repasse.

Hoje o projeto já tem `reservations` + fluxo de pagamento simulado de R$ 49,90 fixo (`reservas.$id.tsx`). Vou estender, não reescrever — para não quebrar fluxo existente, painel admin, notificações, documentos e reviews.

## Entregas (sequencial, 1 entrega por turno)

### Entrega 1 — Núcleo Comercial (essa rodada)
1. **DB**: nova tabela `marketplace_pricing_rules` (escopo GLOBAL/INSTITUTION/COURSE/SCHOLARSHIP + 3 tipos: FIXED_AMOUNT / PERCENTAGE_OF_COURSE_VALUE / FIRST_MONTHLY_PAYMENT). Seed da regra global R$ 59,90.
2. **DB**: nova tabela `scholarship_letters` (código único, QR, status ISSUED/USED/EXPIRED/CANCELLED, validade) + `letter_validation_events`.
3. **DB**: extensão de `reservations` com `pricing_rule_id`, `amount_charged` (snapshot histórico), `letter_id`.
4. **RPC** `calculate_reservation_fee(scholarship_id)` aplicando a hierarquia: bolsa → curso → instituição → global.
5. **RPC** `issue_scholarship_letter(reservation_id)` chamada quando pagamento vira `CONFIRMED`/`PAID` — gera código único + define validade.
6. **Hook em `pay_reservation`**: após pagar, chama `issue_scholarship_letter`.
7. **Frontend — Checkout (`reservas.$id.tsx`)**: substitui o `ADHESION_FEE` hardcoded por leitura do `amount_charged` da reserva. Atualiza copy (Carta de Apresentação, pagamento único ao Tô de Bolsa, mensalidades direto com instituição). Botão: "Pagar e emitir minha Carta de Apresentação".
8. **Frontend — Painel aluno**: na tela de reserva confirmada, botão **"Baixar Carta de Apresentação"** (PDF gerado client-side com jsPDF, contendo dados da bolsa + QR Code apontando para `/validar-carta/{codigo}`).
9. **Frontend — `/validar-carta/$codigo`**: rota pública mostrando validade da carta + dados da bolsa.
10. **Frontend — Admin `/admin/configuracoes-comerciais`**: CRUD da regra global + lista de regras por escopo. Toggle ativo, valor mínimo/máximo, nome público, descrição.
11. **Copy**: substituir "taxa de adesão" / "garantir vaga" por "reservar bolsa" / "emitir Carta de Apresentação" nas telas afetadas (checkout, card de reserva, e-mail templates relevantes).

### Entrega 2 — Painéis & Validação (próximo turno)
- Painel instituição: aba **"Alunos encaminhados"** com listagem de cartas + ações (matriculado / não compareceu / em atendimento) escrevendo em `letter_validation_events`.
- Painel admin: `/admin/reservas-bolsas` com filtros (pagamento, carta, instituição, período).
- Painel admin: regras de pricing por instituição/curso/bolsa (UI hierárquica).
- Painel instituição: ao criar bolsa, opção controlada de pricing (usar global / solicitar valor especial → fica `pending_approval` para admin).

### Entrega 3 — Pagamento real (depende da decisão Stripe anterior)
- Substituir o `pay_reservation` simulado por checkout Stripe embedded, com webhook chamando `issue_scholarship_letter` na confirmação.
- Status PENDING_PAYMENT / PAID / FAILED / REFUNDED espelhados de Stripe.

## Pontos técnicos

- **Snapshot histórico**: `reservations.amount_charged` é gravado no momento da criação; mudanças posteriores em `marketplace_pricing_rules` não afetam reservas antigas (regra 13.5).
- **Tabela `reservations` existente** já tem `amount_paid` — vou reutilizar, adicionando `pricing_rule_id` e `letter_id`. Não crio `scholarship_reservations` duplicada (evita reescrever painel admin, documents, reviews).
- **Carta**: status `ISSUED` na emissão; `USED` quando instituição marca matriculado; `EXPIRED` por cron diário.
- **Validade da carta**: padrão 30 dias, configurável na regra de pricing.
- **PDF da Carta**: gerado client-side (jsPDF + qrcode) sob demanda — sem storage necessário na fase 1.
- **RLS**: cartas legíveis pelo aluno dono, pela instituição da bolsa, por admin. Página `/validar-carta` usa endpoint público read-only com apenas campos não-PII.

## Confirmar antes de seguir

1. **Validade padrão da carta**: 30 dias a partir da emissão — OK?
2. **Cobrança ativa agora**: mantenho o pagamento simulado (R$ 59,90, sem Stripe) para destravar Entregas 1 e 2, e o Stripe real entra só na Entrega 3 — OK?
3. **Reservas existentes no banco** (se houver): mantenho como estão (`amount_paid = 49,90`) sem migrar — OK?

Se sim a tudo, implemento a **Entrega 1** no próximo turno.
