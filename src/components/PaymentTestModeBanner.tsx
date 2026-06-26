const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        Checkout em produção não está configurado. Conclua a ativação do Stripe para receber pagamentos reais.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-warning/10 border-b border-warning/30 px-4 py-2 text-center text-sm text-warning-foreground">
        Pagamentos no preview estão em modo de teste. Use o cartão <code className="font-mono">4242 4242 4242 4242</code>.
      </div>
    );
  }
  return null;
}
