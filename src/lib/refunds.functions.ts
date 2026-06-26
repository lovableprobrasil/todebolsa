import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Env = z.enum(["sandbox", "live"]);

// Aluno solicita cancelamento da própria reserva (apenas registra pedido)
export const studentRequestRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      reservation_id: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { error } = await context.supabase.rpc("student_request_refund", {
      p_reservation_id: data.reservation_id,
      p_reason: data.reason ?? "",
    } as any);
    if (error) return { error: error.message };
    return { ok: true };
  });

// Admin processa reembolso na Stripe + atualiza estado local
export const processRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      reservation_id: z.string().uuid(),
      reason: z.string().max(500).optional(),
      environment: Env,
    }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; stripe_refund_id?: string } | { error: string }> => {
    try {
      // Verifica admin
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId, _role: "PLATFORM_ADMIN",
      } as any);
      if (!isAdmin) return { error: "Acesso negado" };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");

      // Confere reserva paga
      const { data: res, error: resErr } = await supabaseAdmin
        .from("reservations")
        .select("id, payment_status, reservation_code")
        .eq("id", data.reservation_id)
        .maybeSingle();
      if (resErr || !res) return { error: "Reserva não encontrada" };
      if (res.payment_status !== "PAID") return { error: "Reserva não está paga" };

      // Localiza a PaymentIntent na Stripe pelos metadados gravados no checkout
      const stripe = createStripeClient(data.environment);
      let stripeRefundId: string | undefined;
      try {
        const piSearch = await stripe.paymentIntents.search({
          query: `metadata['reservation_id']:'${data.reservation_id}' AND status:'succeeded'`,
          limit: 1,
        });
        const pi = piSearch.data[0];
        if (pi) {
          const refund = await stripe.refunds.create({
            payment_intent: pi.id,
            reason: "requested_by_customer",
            metadata: { reservation_id: data.reservation_id },
          });
          stripeRefundId = refund.id;
        }
      } catch (e) {
        // Se a Stripe falhar, surface a mensagem ao admin antes de mexer no estado local
        return { error: getStripeErrorMessage(e) };
      }

      // Aplica o estado local (mesmo se não havia PI na Stripe — fallback manual)
      const { error: rpcErr } = await context.supabase.rpc("complete_refund", {
        p_reservation_id: data.reservation_id,
        p_reason: data.reason ?? "",
        p_stripe_refund_id: stripeRefundId ?? null,
      } as any);
      if (rpcErr) return { error: rpcErr.message };

      return { ok: true, stripe_refund_id: stripeRefundId };
    } catch (e) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(e) };
    }
  });
