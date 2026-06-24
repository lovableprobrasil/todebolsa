import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Download, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meus-dados")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  const exportData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("export_my_data");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-todebolsa-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram baixados.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("request_account_deletion", { p_reason: reason });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação registrada. Você tem 30 dias para cancelar.");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Privacidade e dados (LGPD)
        </h1>
        <p className="text-muted-foreground mt-1">Exporte seus dados, gerencie consentimentos e solicite exclusão.</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-display font-bold flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Exportar meus dados</h2>
        <p className="text-sm text-muted-foreground">
          Baixe um arquivo JSON com todas as informações que armazenamos sobre você: perfil, reservas, favoritos,
          documentos enviados, avaliações e consentimentos.
        </p>
        <Button onClick={() => exportData.mutate()} disabled={exportData.isPending}>
          <Download className="h-4 w-4 mr-2" /> Baixar dados
        </Button>
      </section>

      <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
        <h2 className="font-display font-bold text-destructive flex items-center gap-2">
          <Trash2 className="h-5 w-5" /> Excluir minha conta
        </h2>
        <div className="flex gap-3 items-start text-sm">
          <AlertTriangle className="h-4 w-4 text-warning-foreground shrink-0 mt-0.5" />
          <p>
            Sua conta será marcada para exclusão e removida em até 30 dias. Reservas em andamento serão canceladas.
            Você pode reverter a solicitação fazendo login antes do prazo.
          </p>
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Motivo (opcional). Sua resposta ajuda a melhorar o Tô de Bolsa."
        />
        <Button variant="destructive" onClick={() => requestDeletion.mutate()} disabled={requestDeletion.isPending}>
          Solicitar exclusão
        </Button>
      </section>
    </div>
  );
}
