import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, GraduationCap, Home, Loader2, RefreshCw } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/adquirir/$scholarshipId")({
  head: () => ({
    meta: [
      { title: "Aquisição da bolsa | Tô de Bolsa" },
      { name: "description", content: "Finalize a aquisição da sua bolsa de estudo com segurança dentro do portal Tô de Bolsa." },
      { property: "og:title", content: "Aquisição da bolsa | Tô de Bolsa" },
      { property: "og:description", content: "Finalize a aquisição da sua bolsa de estudo com segurança dentro do portal Tô de Bolsa." },
    ],
  }),
  component: AcquisitionFramePage,
});

function AcquisitionFramePage() {
  const { scholarshipId } = Route.useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameState, setFrameState] = useState<"loading" | "ready" | "error">("loading");
  const [frameKey, setFrameKey] = useState(0);

  const checkoutSrc = useMemo(
    () => `/checkout/${encodeURIComponent(scholarshipId)}?embedded=1`,
    [scholarshipId, frameKey],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "tdb_checkout_ready") setFrameState("ready");
      if (event.data?.type === "tdb_checkout_error") setFrameState("error");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (frameState !== "loading") return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const text = iframeRef.current?.contentDocument?.body?.innerText ?? "";
      if (/Bolsa não encontrada|Não foi possível carregar|Página não encontrada/i.test(text)) {
        setFrameState("error");
        window.clearInterval(timer);
      }
      if (/Seus dados|Confirme os detalhes da bolsa|Pagamento seguro/i.test(text)) {
        setFrameState("ready");
        window.clearInterval(timer);
      }
      if (attempts >= 40) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [frameState, frameKey]);

  const inspectFrame = () => {
    const text = iframeRef.current?.contentDocument?.body?.innerText ?? "";
    if (/Bolsa não encontrada|Não foi possível carregar|Página não encontrada/i.test(text)) {
      setFrameState("error");
      return;
    }
    window.setTimeout(() => {
      const latestText = iframeRef.current?.contentDocument?.body?.innerText ?? "";
      if (/Bolsa não encontrada|Não foi possível carregar|Página não encontrada/i.test(latestText)) {
        setFrameState("error");
      } else {
        setFrameState("ready");
      }
    }, 600);
  };

  const retry = () => {
    setFrameState("loading");
    setFrameKey((key) => key + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" asChild>
              <Link to="/bolsas" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar às bolsas
              </Link>
            </Button>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              Fluxo seguro dentro do portal
            </div>
          </div>

          <div className="relative min-h-[78vh] overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            {frameState === "loading" && (
              <div className="absolute inset-0 z-10 grid place-content-center bg-card/90">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Carregando aquisição da bolsa...
                </div>
              </div>
            )}

            {frameState === "error" ? (
              <div className="grid min-h-[78vh] place-content-center px-4">
                <Card className="max-w-md">
                  <CardContent className="space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">Não conseguimos abrir esta aquisição</h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        A bolsa pode ter sido atualizada ou indisponibilizada. Para evitar tela em branco, mantivemos você no portal.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Button onClick={() => navigate({ to: "/" })}>
                        <Home className="mr-2 h-4 w-4" />
                        Voltar para home
                      </Button>
                      <Button variant="outline" onClick={retry}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tentar novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <iframe
                key={frameKey}
                ref={iframeRef}
                src={checkoutSrc}
                title="Aquisição da bolsa"
                className="h-[78vh] w-full border-0 bg-background"
                onLoad={inspectFrame}
                onError={() => setFrameState("error")}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}