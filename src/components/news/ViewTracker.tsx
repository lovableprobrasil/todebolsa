import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "news:viewed";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      if (viewed.includes(slug)) return;
      void supabase.rpc("increment_news_view", { _slug: slug });
      viewed.push(slug);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(viewed.slice(-50)));
    } catch {
      /* ignore */
    }
  }, [slug]);

  return null;
}
