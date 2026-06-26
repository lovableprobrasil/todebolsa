import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createScholarshipCheckoutSession } from "@/lib/payments.functions";

export interface ScholarshipCheckoutProps {
  sessionToken: string;
  account: { name: string; email: string; password?: string; cpf?: string; phone?: string };
  returnUrl: string;
  onError?: (msg: string) => void;
}

export function StripeScholarshipCheckout({
  sessionToken,
  account,
  returnUrl,
  onError,
}: ScholarshipCheckoutProps) {
  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        const result = await createScholarshipCheckoutSession({
          data: {
            session_token: sessionToken,
            account,
            return_url: returnUrl,
            environment: getStripeEnvironment(),
          },
        });
        if ("error" in result) {
          onError?.(result.error);
          throw new Error(result.error);
        }
        if (!result.clientSecret) {
          const msg = "Stripe não retornou um client secret";
          onError?.(msg);
          throw new Error(msg);
        }
        return result.clientSecret;
      },
    }),
    // Stable across renders for this mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
