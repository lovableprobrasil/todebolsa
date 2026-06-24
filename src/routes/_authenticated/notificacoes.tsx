import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["notifications-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-all"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("notifications").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-all"] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Bell className="h-7 w-7 text-primary" /> Notificações
        </h1>
        <p className="text-muted-foreground mt-1">Atualizações sobre suas reservas, pagamentos e matrículas.</p>
      </header>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />))}</div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma notificação por aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <div key={n.id} className={cn(
              "rounded-2xl border border-border bg-card p-4 flex gap-3 items-start",
              !n.read_at && "ring-1 ring-primary/30",
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <div className="font-bold">{n.title}</div>
                </div>
                {n.message && <div className="text-sm text-muted-foreground mt-1">{n.message}</div>}
                <div className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
                {n.link && (
                  <Link to={n.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                    Abrir →
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {!n.read_at && (
                  <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)} title="Marcar como lida">
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => del.mutate(n.id)} title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
