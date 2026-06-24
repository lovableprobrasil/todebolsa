import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Search, Shield, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: AdminUsers,
});

const ROLES = ["STUDENT", "GUARDIAN", "INSTITUTION_USER", "INSTITUTION_ADMIN", "PLATFORM_SALES", "PLATFORM_ADMIN"] as const;

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_search: q ? q : undefined, p_limit: 100, p_offset: 0,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  type Role = "STUDENT" | "GUARDIAN" | "INSTITUTION_USER" | "INSTITUTION_ADMIN" | "PLATFORM_SALES" | "PLATFORM_ADMIN";
  const grant = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: Role }) => {
      const { error } = await supabase.rpc("assign_user_role", { p_user_id: uid, p_role: role, p_institution_id: undefined });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Função atribuída."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: Role }) => {
      const { error } = await supabase.rpc("revoke_user_role", { p_user_id: uid, p_role: role, p_institution_id: undefined });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Função removida."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary-soft text-primary inline-flex items-center justify-center font-bold">
                    {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{u.name ?? "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(u.roles ?? []).map((r: string) => (
                    <Badge key={r} className="bg-secondary text-foreground border-0">{r}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <RoleSelector currentRoles={u.roles ?? []} onGrant={(role) => grant.mutate({ uid: u.id, role })} />
                {(u.roles ?? []).filter((r: string) => r !== "STUDENT").map((r: string) => (
                  <Button key={r} size="sm" variant="ghost" onClick={() => revoke.mutate({ uid: u.id, role: r })}>
                    <ShieldOff className="h-3.5 w-3.5 mr-1" /> Remover {r}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" /> Nenhum usuário encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleSelector({ currentRoles, onGrant }: { currentRoles: string[]; onGrant: (r: string) => void }) {
  const [open, setOpen] = useState(false);
  const available = ROLES.filter((r) => !currentRoles.includes(r));
  if (available.length === 0) return null;
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Shield className="h-3.5 w-3.5 mr-1" /> Atribuir função
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 z-40 min-w-[200px] rounded-xl border border-border bg-popover shadow-lg p-1">
            {available.map((r) => (
              <button key={r} onClick={() => { onGrant(r); setOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
