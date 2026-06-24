import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, Trash2, Upload, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DocType =
  | "RG" | "CPF" | "PROOF_OF_ADDRESS" | "INCOME_PROOF"
  | "PREVIOUS_DIPLOMA" | "ENROLLMENT_DECLARATION" | "PHOTO" | "OTHER";

const DOC_LABEL: Record<DocType, string> = {
  RG: "RG",
  CPF: "CPF",
  PROOF_OF_ADDRESS: "Comprovante de residência",
  INCOME_PROOF: "Comprovante de renda",
  PREVIOUS_DIPLOMA: "Histórico/Diploma anterior",
  ENROLLMENT_DECLARATION: "Declaração de matrícula",
  PHOTO: "Foto 3x4",
  OTHER: "Outro documento",
};

const REQUIRED: DocType[] = ["RG", "CPF", "PROOF_OF_ADDRESS"];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Em análise", cls: "bg-warning/15 text-warning-foreground" },
  APPROVED: { label: "Aprovado", cls: "bg-success/15 text-success-foreground" },
  REJECTED: { label: "Recusado", cls: "bg-destructive/15 text-destructive" },
};

export function DocumentUpload({ reservationId, userId }: { reservationId: string; userId: string }) {
  const qc = useQueryClient();
  const [docType, setDocType] = useState<DocType>("RG");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["enrollment-docs", reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment_documents")
        .select("*")
        .eq("reservation_id", reservationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const missing = useMemo(() => {
    const sent = new Set(docs.filter((d) => d.status !== "REJECTED").map((d) => d.doc_type));
    return REQUIRED.filter((r) => !sent.has(r));
  }, [docs]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione um arquivo.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Arquivo deve ter no máximo 10 MB.");
      setUploading(true);
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${reservationId}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("enrollment-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: rpcErr } = await supabase.rpc("submit_enrollment_document", {
        p_reservation_id: reservationId,
        p_doc_type: docType,
        p_file_path: path,
        p_file_name: file.name,
        p_file_size: file.size,
        p_mime_type: file.type,
      });
      if (rpcErr) {
        await supabase.storage.from("enrollment-documents").remove([path]);
        throw rpcErr;
      }
    },
    onSuccess: () => {
      toast.success("Documento enviado!");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["enrollment-docs", reservationId] });
      qc.invalidateQueries({ queryKey: ["reservation", reservationId] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha no envio."),
    onSettled: () => setUploading(false),
  });

  const remove = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("enrollment-documents").remove([doc.file_path]);
      const { error } = await supabase.from("enrollment_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento removido.");
      qc.invalidateQueries({ queryKey: ["enrollment-docs", reservationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-5">
      <header>
        <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" /> Envio de documentos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envie os documentos solicitados para que a instituição finalize sua matrícula.
        </p>
      </header>

      {missing.length > 0 && (
        <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-warning-foreground shrink-0" />
          <div className="text-sm">
            <strong>Documentos obrigatórios faltando:</strong>{" "}
            {missing.map((m) => DOC_LABEL[m]).join(", ")}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(DOC_LABEL) as DocType[]).map((k) => (
                <SelectItem key={k} value={k}>{DOC_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate">{file ? file.name : "Selecionar arquivo (PDF/imagem, até 10 MB)"}</span>
          </label>
        </div>
        <Button onClick={() => upload.mutate()} disabled={!file || uploading} className="font-semibold">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Enviar
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Documentos enviados</h3>
        {isLoading && <div className="h-16 rounded-xl bg-muted animate-pulse" />}
        {!isLoading && docs.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Nenhum documento enviado ainda.</p>
        )}
        {docs.map((d) => {
          const st = STATUS_LABEL[d.status] ?? STATUS_LABEL.PENDING;
          return (
            <div key={d.id} className="rounded-xl border border-border bg-secondary/40 p-3 flex flex-wrap items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{DOC_LABEL[d.doc_type as DocType] ?? d.doc_type}</div>
                <div className="text-xs text-muted-foreground truncate">{d.file_name}</div>
                {d.status === "REJECTED" && d.rejection_reason && (
                  <div className="text-xs text-destructive mt-1">Motivo: {d.rejection_reason}</div>
                )}
              </div>
              <Badge className={cn("border-0", st.cls)}>{st.label}</Badge>
              {d.status === "PENDING" && (
                <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: d.id, file_path: d.file_path })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {d.status === "APPROVED" && <CheckCircle2 className="h-4 w-4 text-success" />}
              {d.status === "REJECTED" && <XCircle className="h-4 w-4 text-destructive" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
