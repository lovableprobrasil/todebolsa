import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/checkout/retorno")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    session_token: typeof s.session_token === "string" ? s.session_token : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { session_token } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"polling" | "ok" | "error">("polling");
  const [reservationId, setReservationId] = useState<string | null>(null);

  useEffect(() => {
    if (!session_token) { setStatus("error"); return; }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts++;
      const { data } = await supabase
        .from("checkout_sessions")
        .select("status, reservation_id")
        .eq("session_token", session_token)
        .maybeSingle();
      if (cancelled) return;
      if (data?.status === "CONVERTED" && data.reservation_id) {
        setReservationId(data.reservation_id);
        setStatus("ok");
        // Clear local token
        try { localStorage.removeItem("tdb_checkout_token_" + session_token); } catch {}
        return;
      }
      if (attempts >= 30) { setStatus("error"); return; }
      setTimeout(tick, 2000);
    };
    tick();
    return () => { cancelled = true; };
  }, [session_token]);

  return (
    <div className="min-h-screen grid place-content-center bg-muted/30 px-4">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-4">
        {status === "polling" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold">Confirmando seu pagamento…</h1>
            <p className="text-sm text-muted-foreground">Isso leva apenas alguns segundos.</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
            <p className="text-sm text-muted-foreground">Sua Carta de Apresentação já está disponível.</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => reservationId && navigate({ to: "/reservas/$id", params: { id: reservationId } })}>
                Ver minha reserva
              </Button>
              <Button variant="ghost" asChild><Link to="/">Voltar para a home</Link></Button>
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Não conseguimos confirmar</h1>
            <p className="text-sm text-muted-foreground">
              Se o valor foi debitado, sua reserva será liberada automaticamente em instantes. Você também pode acompanhar pelo seu painel.
            </p>
            <Button asChild><Link to="/reservas">Ir para minhas reservas</Link></Button>
          </>
        )}
      </CardContent></Card>
    </div>
  );
}
