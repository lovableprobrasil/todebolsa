import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const KEY = "tdb_cookie_consent_v1";

type Choice = "all" | "essential";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {/* ignore */}
  }, []);

  const log = async (choice: Choice) => {
    try {
      localStorage.setItem(KEY, choice);
      await supabase.from("consent_log").insert({
        consent_type: "cookies",
        granted: choice === "all",
        version: "1.0",
        user_agent: navigator.userAgent,
      });
    } catch {/* ignore */}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-3 inset-x-3 z-50 max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-2xl p-4 md:p-5 flex flex-wrap items-center gap-3"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0">
        <Cookie className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-[220px]">
        <h2 id="cookie-banner-title" className="font-bold text-sm">Sua privacidade vem primeiro</h2>
        <p id="cookie-banner-desc" className="text-xs text-muted-foreground mt-0.5">
          Usamos cookies essenciais para funcionar e analíticos opcionais para melhorar sua experiência. Leia nossa{" "}
          <Link to="/privacidade" className="underline text-primary hover:text-primary/80">Política de Privacidade</Link>.
        </p>
      </div>
      <div className="flex gap-2 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => log("essential")}>Só essenciais</Button>
        <Button size="sm" onClick={() => log("all")}>Aceitar todos</Button>
        <button
          aria-label="Fechar"
          onClick={() => log("essential")}
          className="rounded-full p-1 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
