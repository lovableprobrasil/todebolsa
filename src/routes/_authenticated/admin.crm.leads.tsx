import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Mail, Phone, MapPin, BookOpen, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm/leads")({
  component: LeadsPage,
});

const STATUSES = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "WAITING", label: "Aguardando" },
  { value: "INTERESTED", label: "Interessado" },
  { value: "RESERVATION_STARTED", label: "Reserva iniciada" },
  { value: "RESERVATION_DONE", label: "Reserva concluída" },
  { value: "ENROLLMENT_IN_PROGRESS", label: "Matrícula em andamento" },
  { value: "ENROLLMENT_DONE", label: "Matrícula concluída" },
  { value: "LOST", label: "Perdido" },
] as const;

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-warning/15 text-warning-foreground",
  CONTACTED: "bg-primary-soft text-primary",
  WAITING: "bg-muted text-muted-foreground",
  INTERESTED: "bg-primary/15 text-primary",
  RESERVATION_STARTED: "bg-primary/15 text-primary",
  RESERVATION_DONE: "bg-success/15 text-success-foreground",
  ENROLLMENT_IN_PROGRESS: "bg-success/15 text-success-foreground",
  ENROLLMENT_DONE: "bg-success/20 text-success-foreground",
  LOST: "bg-destructive/15 text-destructive",
};

type Lead = {
  id: string; name: string; email: string | null; phone: string | null;
  city: string | null; course_interest: string | null; source: string | null;
  status: string; notes: string | null; created_at: string;
};

function LeadsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.rpc("update_lead_status", { p_lead_id: id, p_status: status as never });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="h-60 rounded-2xl bg-muted animate-pulse" />;
  const all = leads ?? [];
  const filtered = all.filter((l) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (search && !(`${l.name} ${l.email ?? ""} ${l.phone ?? ""} ${l.city ?? ""}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Inbox className="h-5 w-5" /> Leads de alunos</h2>
          <p className="text-sm text-muted-foreground">{all.length} leads cadastrados.</p>
        </div>
        <NewLeadDialog onCreated={() => qc.invalidateQueries({ queryKey: ["admin-leads"] })} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar por nome, e-mail, telefone, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lead encontrado.</div>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{l.name}</span>
                <Badge className={(STATUS_TONE[l.status] ?? "") + " border-0 text-xs"}>
                  {STATUSES.find((s) => s.value === l.status)?.label ?? l.status}
                </Badge>
                {l.source && <span className="text-xs text-muted-foreground">via {l.source}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                {l.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                {l.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone}</span>}
                {l.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{l.city}</span>}
                {l.course_interest && <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{l.course_interest}</span>}
              </div>
              {l.notes && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{l.notes}</p>}
            </div>
            <Select value={l.status} onValueChange={(v) => statusMut.mutate({ id: l.id, status: v })}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewLeadDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", course_interest: "", source: "ADMIN", notes: "" });
  const mut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome");
      const { error } = await supabase.from("leads").insert({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        course_interest: form.course_interest.trim() || null,
        source: form.source || null,
        notes: form.notes.trim() || null,
        status: "NEW" as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead criado");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", city: "", course_interest: "", source: "ADMIN", notes: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Novo lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={32} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} /></div>
            <div><Label>Curso de interesse</Label><Input value={form.course_interest} onChange={(e) => setForm({ ...form, course_interest: e.target.value })} maxLength={120} /></div>
          </div>
          <div><Label>Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} maxLength={40} /></div>
          <div><Label>Notas</Label><Textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Criar lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
