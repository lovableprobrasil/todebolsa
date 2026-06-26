import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type StripeEnv = "sandbox" | "live";

type CreateScholarshipCheckoutResult =
  | { clientSecret: string; sessionToken: string; userId: string; reservationId: string }
  | { error: string };

const AccountSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

const InputSchema = z.object({
  session_token: z.string().min(10),
  account: AccountSchema,
  return_url: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

async function resolveOrCreateAuthUser(
  supabaseAdmin: any,
  email: string,
  name: string,
  password?: string,
): Promise<{ id: string; created: boolean }> {
  // Try to find existing user
  let page = 1;
  while (page <= 20) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    const match = list?.users.find((u: any) => (u.email || "").toLowerCase() === email);
    if (match) return { id: match.id, created: false };
    if (!list?.users.length || list.users.length < 200) break;
    page++;
  }
  if (!password) throw new Error("Usuário não encontrado. Faça login para continuar.");
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !created.user) throw new Error(error?.message || "Falha ao criar conta");
  return { id: created.user.id, created: true };
}

async function resolveOrCreateStripeCustomer(
  stripe: any,
  options: { email: string; userId: string; name: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  const existing = await stripe.customers.list({ email: options.email, limit: 1 });
  if (existing.data.length) {
    const c = existing.data[0];
    if (c.metadata?.userId !== options.userId) {
      await stripe.customers.update(c.id, {
        metadata: { ...c.metadata, userId: options.userId },
      });
    }
    return c.id;
  }
  const created = await stripe.customers.create({
    email: options.email,
    name: options.name,
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createScholarshipCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<CreateScholarshipCheckoutResult> => {
    try {
      const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const email = data.account.email.trim().toLowerCase();

      // 1. Load checkout session and validate
      const { data: session, error: sessionErr } = await supabaseAdmin
        .from("checkout_sessions")
        .select("id, session_token, status, scholarship_id, amount_charged, reservation_id")
        .eq("session_token", data.session_token)
        .maybeSingle();
      if (sessionErr || !session) return { error: "Sessão de checkout não encontrada" };
      if (session.status === "CONVERTED" && session.reservation_id) {
        return { error: "Esta sessão já foi finalizada" };
      }

      // 2. Resolve or create user
      const { id: userId } = await resolveOrCreateAuthUser(
        supabaseAdmin,
        email,
        data.account.name,
        data.account.password,
      );

      // 3. Sync profile
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          name: data.account.name,
          email,
          phone: data.account.phone ? data.account.phone.replace(/\D/g, "") : null,
          cpf: data.account.cpf ? data.account.cpf.replace(/\D/g, "") : null,
        } as any,
        { onConflict: "id" },
      );

      // 4. Pre-finalize: create a PENDING reservation now so we have an id to track
      const { data: reservationId, error: finErr } = await supabaseAdmin.rpc("checkout_finalize", {
        p_session_token: data.session_token,
        p_user_id: userId,
      } as any);
      if (finErr) return { error: finErr.message };

      // 5. Resolve fee amount (cents)
      const amount = Number(session.amount_charged ?? 0);
      const amountInCents = Math.round(amount * 100);
      if (amountInCents < 50) return { error: "Valor inválido para cobrança" };

      // 6. Create Stripe Checkout Session (Embedded)
      const stripe = createStripeClient(data.environment as StripeEnv);
      const customerId = await resolveOrCreateStripeCustomer(stripe, {
        email,
        userId,
        name: data.account.name,
      });

      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.return_url,
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "brl",
              unit_amount: amountInCents,
              product_data: {
                name: "Tô de Bolsa — Carta de Apresentação",
                description: "Taxa de emissão da Carta de Apresentação para garantia da bolsa",
              },
            },
          },
        ],
        payment_intent_data: {
          description: "Tô de Bolsa — Carta de Apresentação",
          metadata: {
            checkout_session_token: data.session_token,
            user_id: userId,
            reservation_id: String(reservationId),
          },
        },
        metadata: {
          checkout_session_token: data.session_token,
          user_id: userId,
          reservation_id: String(reservationId),
        },
      } as any);

      // 7. Store stripe session id on our checkout session for reconciliation
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("session_token", data.session_token);

      return {
        clientSecret: stripeSession.client_secret ?? "",
        sessionToken: data.session_token,
        userId,
        reservationId: String(reservationId),
      };
    } catch (error) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(error) };
    }
  });
