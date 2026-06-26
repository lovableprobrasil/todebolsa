import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, Search, Shield, ShieldOff, UserPlus, Ban, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  adminListUsers, adminCreateUser, adminSetUserSuspended, adminDeleteUser,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: AdminUsers,
});

const ROLES = ["STUDENT", "GUARDIAN", "INSTITUTION_USER", "INSTITUTION_ADMIN", "INSTITUTION_APPLICANT", "PLATFORM_SALES", "PLATFORM_ADMIN"] as const;
type Role = (typeof ROLES)[number];
const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Estudante",
  GUARDIAN: "Responsável",
  INSTITUTION_USER: "Usuário da instituição",
  INSTITUTION_ADMIN: "Administrador da instituição",
  INSTITUTION_APPLICANT: "Instituição em análise",
  PLATFORM_SALES: "Comercial da plataforma",
  PLATFORM_ADMIN: "Administrador da plataforma",
};
const roleLabel = (r: string) => ROLE_LABELS[r] ?? r;

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const listFn = useServerFn(adminListUsers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-v2", q],
    queryFn: () => listFn({ data: { search: q || undefined, limit: 100, offset: 0 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users-v2"] });

  const grant = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: Role }) => {
      const { error } = await supabase.rpc("assign_user_role", { p_user_id: uid, p_role: role, p_institution_id: undefined });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Função atribuída."); },
    onError: (e: Error) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: Role }) => {
      const { error } = await supabase.rpc("revoke_user_role", { p_user_id: uid, p_role: role, p_institution_id: undefined });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Função removida."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendFn = useServerFn(adminSetUserSuspended);
  const suspend = useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      suspendFn({ data: { userId, suspended } }),
    onSuccess: (_d, v) => { invalidate(); toast.success(v.suspended ? "Usuário suspenso." : "Usuário reativado."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFn = useServerFn(adminDeleteUser);
  const remove = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => { invalidate(); toast.success("Usuário excluído."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[240px] rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <CreateUserDialog onCreated={invalidate} />
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((u: any) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary-soft text-primary inline-flex items-center justify-center font-bold">
                    {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate flex items-center gap-2">
                      {u.name ?? "Sem nome"}
                      {u.suspended && <Badge className="bg-destructive/10 text-destructive border-0">Suspenso</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(u.roles ?? []).map((r: string) => (
                    <Badge key={r} className="bg-secondary text-foreground border-0">{roleLabel(r)}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <RoleSelector currentRoles={u.roles ?? []} onGrant={(role) => grant.mutate({ uid: u.id, role: role as Role })} />
                {(u.roles ?? []).filter((r: string) => r !== "STUDENT").map((r: string) => (
                  <Button key={r} size="sm" variant="ghost" onClick={() => revoke.mutate({ uid: u.id, role: r as Role })}>
                    <ShieldOff className="h-3.5 w-3.5 mr-1" /> Remover {roleLabel(r)}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => suspend.mutate({ userId: u.id, suspended: !u.suspended })}
                  disabled={suspend.isPending}
                >
                  {u.suspended ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Reativar</> : <><Ban className="h-3.5 w-3.5 mr-1" /> Suspender</>}
                </Button>
                <DeleteUserButton onConfirm={() => remove.mutate(u.id)} pending={remove.isPending} email={u.email} />
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
          <div className="absolute left-0 mt-2 z-40 min-w-[220px] rounded-xl border border-border bg-popover shadow-lg p-1">
            {available.map((r) => (
              <button key={r} onClick={() => { onGrant(r); setOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                {roleLabel(r)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const createFn = useServerFn(adminCreateUser);
  const create = useMutation({
    mutationFn: () => createFn({ data: { name, email, password, role } }),
    onSuccess: () => {
      toast.success("Usuário criado.");
      setOpen(false); setName(""); setEmail(""); setPassword(""); setRole("STUDENT");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="h-4 w-4 mr-1" /> Novo usuário</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo usuário</DialogTitle>
          <DialogDescription>A conta já será criada com e-mail confirmado.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nu-name">Nome completo</Label>
            <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">E-mail</Label>
            <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-pw">Senha provisória</Label>
            <PasswordInput id="nu-pw" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Função inicial</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserButton({ onConfirm, pending, email }: { onConfirm: () => void; pending: boolean; email: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove a conta <strong>{email}</strong> permanentemente. Não é possível desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
