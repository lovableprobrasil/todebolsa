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
import { Building2, Plus, Mail, Phone, MapPin, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm/instituicoes")({
  component: ProspectsPage,
});

const STATUSES = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "MEETING_SCHEDULED", label: "Reunião agendada" },
  { value: "PROPOSAL_SENT", label: "Proposta enviada" },
  { value: "NEGOTIATION", label: "Em negociação" },
  { value: "WON", label: "Fechado" },
  { value: "LOST", label: "Perdido" },
] as const;

const TONE: Record<string, string> = {
  NEW: "bg-warning/15 text-warning-foreground",
  CONTACTED: "bg-primary-soft text-primary",
  MEETING_SCHEDULED: "bg-primary/15 text-primary",
  PROPOSAL_SENT: "bg-primary/15 text-primary",
  NEGOTIATION: "bg-primary/20 text-primary",
  WON: "bg-success/15 text-success-foreground",
  LOST: "bg-destructive/15 text-destructive",
};

type Prospect = {
  id: string; trade_name: string; city: string | null; state: string | null;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  website: string | null; estimated_courses: number | null; estimated_students: number | null;
  status: string; next_action_at: string | null; notes: string | null; created_at: string;
};

function ProspectsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_prospects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Prospect[];
    },
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("institution_prospects").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="h-60 rounded-2xl bg-muted animate-pulse" />;
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Building2 className="h-5 w-5" /> Prospecção de instituições</h2>
          <p className="text-sm text-muted-foreground">{rows.length} instituições no pipeline comercial.</p>
        </div>
        <NewProspectDialog onCreated={() => qc.invalidateQueries({ queryKey: ["prospects"] })} />
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {STATUSES.map((s) => {
          const items = rows.filter((r) => r.status === s.value);
          return (
            <div key={s.value} className="rounded-2xl border border-border bg-card p-3 min-h-40">
              <div className="text-xs font-semibold mb-2 flex justify-between"><span>{s.label}</span><span className="text-muted-foreground">{items.length}</span></div>
              <div className="space-y-2">
                {items.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-background p-2.5 text-xs">
                    <div className="font-semibold text-sm">{p.trade_name}</div>
                    {(p.city || p.state) && <div className="text-muted-foreground">{[p.city, p.state].filter(Boolean).join(" / ")}</div>}
                    {p.contact_name && <div className="text-muted-foreground mt-1">{p.contact_name}</div>}
                    <Select value={p.status} onValueChange={(v) => statusMut.mutate({ id: p.id, status: v })}>
                      <SelectTrigger className="mt-2 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <h3 className="font-display text-base font-bold mb-2">Detalhes</h3>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma instituição cadastrada ainda.</div>}
          {rows.map((p) => (
            <div key={p.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.trade_name}</span>
                <Badge className={(TONE[p.status] ?? "") + " border-0 text-xs"}>{STATUSES.find((s) => s.value === p.status)?.label ?? p.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                {p.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{p.contact_email}</span>}
                {p.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.contact_phone}</span>}
                {(p.city || p.state) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[p.city, p.state].filter(Boolean).join("/")}</span>}
                {p.website && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{p.website}</span>}
              </div>
              {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NewProspectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    trade_name: "", city: "", state: "", contact_name: "", contact_email: "", contact_phone: "",
    website: "", estimated_courses: "", estimated_students: "", notes: "",
  });
  const mut = useMutation({
    mutationFn: async () => {
      if (!form.trade_name.trim()) throw new Error("Informe o nome da instituição");
      const { error } = await supabase.from("institution_prospects").insert({
        trade_name: form.trade_name.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        website: form.website.trim() || null,
        estimated_courses: form.estimated_courses ? parseInt(form.estimated_courses) : null,
        estimated_students: form.estimated_students ? parseInt(form.estimated_students) : null,
        notes: form.notes.trim() || null,
        status: "NEW" as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instituição adicionada ao pipeline");
      setOpen(false);
      setForm({ trade_name: "", city: "", state: "", contact_name: "", contact_email: "", contact_phone: "", website: "", estimated_courses: "", estimated_students: "", notes: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova instituição</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova instituição no pipeline</DialogTitle></DialogHeader>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          <div><Label>Nome *</Label><Input value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} maxLength={160} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} /></div>
            <div><Label>UF</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} /></div>
          </div>
          <div><Label>Contato</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} maxLength={120} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>E-mail</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} maxLength={255} /></div>
            <div><Label>Telefone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} maxLength={32} /></div>
          </div>
          <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} maxLength={255} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cursos estimados</Label><Input type="number" value={form.estimated_courses} onChange={(e) => setForm({ ...form, estimated_courses: e.target.value })} /></div>
            <div><Label>Alunos estimados</Label><Input type="number" value={form.estimated_students} onChange={(e) => setForm({ ...form, estimated_students: e.target.value })} /></div>
          </div>
          <div><Label>Notas</Label><Textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
