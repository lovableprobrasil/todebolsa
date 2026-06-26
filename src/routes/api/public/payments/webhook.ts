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
      .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
      .eq("session_token", sessionToken);
  }
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
