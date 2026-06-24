import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/matriculas")({
  component: AdminEnrollmentsPage,
});

const STATUS_FILTERS = [
  { key: "UNDER_REVIEW", label: "Em análise" },
  { key: "CONFIRMED", label: "Aguardando docs" },
  { key: "ENROLLMENT_APPROVED", label: "Aprovadas" },
  { key: "ENROLLMENT_REJECTED", label: "Recusadas" },
] as const;

function AdminEnrollmentsPage() {
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]["key"]>("UNDER_REVIEW");
  const qc = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-enrollments", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, reservation_code, status, created_at, user_id, institution_id,
          scholarship:scholarships(title, course_offering:course_offerings(course:courses(name, institution:institutions(trade_name)))),
          documents:enrollment_documents(id, doc_type, file_path, file_name, status, rejection_reason, created_at)
        `)
        .eq("status", filter)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-border bg-card p-6 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h2 className="font-display text-xl font-extrabold">Moderação de matrículas</h2>
          <p className="text-sm text-muted-foreground">Aprove ou recuse documentos e finalize matrículas.</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              filter === s.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-40 rounded-3xl bg-muted animate-pulse" />}

      <div className="space-y-3">
        {reservations.map((r) => (
          <EnrollmentRow key={r.id} reservation={r} onChanged={() => qc.invalidateQueries({ queryKey: ["admin-enrollments"] })} />
        ))}
        {!isLoading && reservations.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            Nada por aqui.
          </div>
        )}
      </div>
    </div>
  );
}

function EnrollmentRow({ reservation, onChanged }: { reservation: any; onChanged: () => void }) {
  const course = reservation.scholarship?.course_offering?.course;
  const inst = course?.institution;
  const docs = reservation.documents ?? [];
  const allApproved = docs.length > 0 && docs.every((d: any) => d.status === "APPROVED");

  return (
    <article className="rounded-3xl border border-border bg-card p-5 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{inst?.trade_name} · {reservation.reservation_code}</div>
          <h3 className="font-display font-bold mt-0.5">{course?.name}</h3>
          <p className="text-xs text-muted-foreground">{reservation.scholarship?.title}</p>
        </div>
        <Badge className="bg-primary-soft text-primary border-0">{docs.length} documento(s)</Badge>
      </header>

      <div className="space-y-2">
        {docs.length === 0 && <p className="text-sm text-muted-foreground italic">Aluno ainda não enviou documentos.</p>}
        {docs.map((d: any) => (
          <DocumentRow key={d.id} doc={d} onChanged={onChanged} />
        ))}
      </div>

      <FinalizeBlock reservation={reservation} allApproved={allApproved} onChanged={onChanged} />
    </article>
  );
}

function DocumentRow({ doc, onChanged }: { doc: any; onChanged: () => void }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const view = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.storage
        .from("enrollment-documents")
        .createSignedUrl(doc.file_path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async (approved: boolean) => {
      const { error } = await supabase.rpc("review_enrollment_document", {
        p_document_id: doc.id,
        p_approved: approved,
        p_reason: approved ? "" : reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliado.");
      setOpen(false);
      setReason("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusBadge = useMemo(() => {
    if (doc.status === "APPROVED") return <Badge className="bg-success/15 text-success-foreground border-0">Aprovado</Badge>;
    if (doc.status === "REJECTED") return <Badge className="bg-destructive/15 text-destructive border-0">Recusado</Badge>;
    return <Badge className="bg-warning/15 text-warning-foreground border-0">Pendente</Badge>;
  }, [doc.status]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3">
      <FileText className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{doc.doc_type} · {doc.file_name}</div>
        {doc.rejection_reason && <div className="text-xs text-destructive">Motivo: {doc.rejection_reason}</div>}
      </div>
      {statusBadge}
      <Button size="sm" variant="ghost" onClick={() => view.mutate()}>
        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
      </Button>
      {doc.status === "PENDING" && (
        <>
          <Button size="sm" onClick={() => review.mutate(true)} disabled={review.isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive"><XCircle className="h-3.5 w-3.5 mr-1" /> Recusar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Motivo da recusa</DialogTitle></DialogHeader>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique o que precisa ser corrigido" />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => review.mutate(false)} disabled={!reason || review.isPending}>
                  {review.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Recusar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function FinalizeBlock({ reservation, allApproved, onChanged }: { reservation: any; allApproved: boolean; onChanged: () => void }) {
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [notes, setNotes] = useState("");

  const finalize = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("finalize_enrollment", {
        p_reservation_id: reservation.id,
        p_approved: decision === "APPROVE",
        p_notes: notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Matrícula finalizada.");
      setNotes("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (reservation.status === "ENROLLMENT_APPROVED" || reservation.status === "ENROLLMENT_REJECTED") return null;

  return (
    <div className="rounded-2xl bg-background border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={decision} onValueChange={(v) => setDecision(v as "APPROVE" | "REJECT")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="APPROVE">Aprovar matrícula</SelectItem>
            <SelectItem value="REJECT">Recusar matrícula</SelectItem>
          </SelectContent>
        </Select>
        {!allApproved && decision === "APPROVE" && (
          <span className="text-xs text-warning-foreground">Recomendado: aprovar todos os documentos antes.</span>
        )}
        <div className="flex-1" />
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/reservas">Detalhes</Link>
        </Button>
        <Button onClick={() => finalize.mutate()} disabled={finalize.isPending}>
          {finalize.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Confirmar
        </Button>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={decision === "APPROVE" ? "Observações internas (opcional)" : "Motivo da recusa (será enviado ao aluno)"}
        rows={2}
      />
    </div>
  );
}
