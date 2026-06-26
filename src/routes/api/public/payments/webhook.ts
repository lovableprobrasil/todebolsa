import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function handleCheckoutSessionCompleted(obj: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const meta = obj.metadata || {};
  const reservationId: string | undefined = meta.reservation_id;
  const sessionToken: string | undefined = meta.checkout_session_token;

  if (reservationId) {
    // Mark reservation as paid
    try {
      await supabaseAdmin.rpc("pay_reservation", {
        p_reservation_id: reservationId,
        p_method: "CARD",
      } as any);
    } catch (e) {
      console.error("pay_reservation failed", e);
    }
  }

  if (sessionToken) {
    await supabaseAdmin
      .from("checkout_sessions")
      .update({ status: "CONVERTED", updated_at: new Date().toISOString() })
      .eq("session_token", sessionToken);
  }
}

async function handleChargeRefunded(charge: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const reservationId: string | undefined =
    charge?.metadata?.reservation_id ||
    charge?.payment_intent_data?.metadata?.reservation_id;
  // Stripe payload may carry refunds inline
  const refunds: any[] = charge?.refunds?.data ?? [];
  const lastRefund = refunds[refunds.length - 1];
  const stripeRefundId: string | undefined = lastRefund?.id;

  if (!reservationId) {
    console.log("charge.refunded sem reservation_id em metadata; ignorado");
    return;
  }
  // Idempotente: se já temos esse refund, não reprocessa
  if (stripeRefundId) {
    const { data: existing } = await supabaseAdmin
      .from("refunds")
      .select("id, status")
      .eq("stripe_refund_id", stripeRefundId)
      .maybeSingle();
    if (existing?.status === "PROCESSED") return;
  }
  await supabaseAdmin.rpc("complete_refund", {
    p_reservation_id: reservationId,
    p_reason: "Reembolso confirmado via Stripe",
    p_stripe_refund_id: stripeRefundId ?? null,
  } as any);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
              await handleCheckoutSessionCompleted(event.data.object);
              break;
            default:
              console.log("Unhandled stripe event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
