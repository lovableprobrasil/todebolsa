import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "tdb_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export async function trackEvent(
  eventType: string,
  opts: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  if (typeof window === "undefined") return;
  try {
    await supabase.rpc("track_event", {
      p_event_type: eventType,
      p_entity_type: opts.entityType ?? "",
      p_entity_id: opts.entityId ?? (null as unknown as string),
      p_session_id: getSessionId(),
      p_path: window.location.pathname + window.location.search,
      p_referrer: document.referrer || "",
      p_metadata: (opts.metadata ?? {}) as never,
    });
  } catch {
    // silent — analytics must never break UX
  }
}

export function trackPageview() {
  return trackEvent("pageview");
}
