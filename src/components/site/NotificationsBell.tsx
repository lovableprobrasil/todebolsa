import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type N = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  type: string;
};

export function NotificationsBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<N[]> => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, link, read_at, created_at, type")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      return (data ?? []) as N[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id).is("read_at", null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          tone === "dark" ? "hover:bg-white/10 text-white" : "hover:bg-muted text-foreground",
        )}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-[340px] max-w-[92vw] rounded-2xl border border-border bg-popover shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-display font-bold text-sm">Notificações</div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Marcar como lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="ml-2 rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {!data || data.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Você ainda não tem notificações.
                </div>
              ) : (
                data.map((n) => {
                  const inner = (
                    <div className={cn(
                      "px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors",
                      !n.read_at && "bg-primary-soft/30",
                    )}>
                      <div className="flex items-start gap-2">
                        {!n.read_at && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{n.title}</div>
                          {n.message && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} to={n.link} onClick={() => setOpen(false)}>{inner}</Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-center">
              <Link to="/notificacoes" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
