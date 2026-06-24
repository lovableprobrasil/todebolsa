import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Shield, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bootstrap")({
  component: AdminBootstrap,
});

function AdminBootstrap() {
  const { user, isPlatformAdmin, refreshRoles } = useAuth();
  const navigate = useNavigate();

  const claim = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshRoles();
      toast.success("Você agora é administrador da plataforma.");
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto rounded-3xl border border-border bg-card p-8 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
        <Shield className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-extrabold">Acesso ao painel master</h1>
      {isPlatformAdmin ? (
        <>
          <p className="text-muted-foreground mt-2">Você já tem privilégios de administrador.</p>
          <Button className="mt-5" onClick={() => navigate({ to: "/admin" })}>Abrir painel</Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground mt-2">
            Se você é o responsável por esta plataforma e ainda não há nenhum administrador, clique abaixo para
            tornar-se o <strong>primeiro administrador</strong>. Esta ação só funciona uma única vez.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Sua conta: {user?.email}</p>
          <Button className="mt-5 gap-2" onClick={() => claim.mutate()} disabled={claim.isPending}>
            <KeyRound className="h-4 w-4" /> Tornar-me admin
          </Button>
        </>
      )}
    </div>
  );
}
