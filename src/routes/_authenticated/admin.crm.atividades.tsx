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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ListChecks, Plus, CheckCircle2, Phone, Mail, MessageSquare, CalendarDays, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm/atividades")({
  component: ActivitiesPage,
});

const ACT_TYPES = [
  { value: "CALL", label: "Ligação", icon: Phone },
  { value: "EMAIL", label: "E-mail", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "MEETING", label: "Reunião", icon: CalendarDays },
  { value: "TASK", label: "Tarefa", icon: ListChecks },
  { value: "NOTE", label: "Nota", icon: FileText },
] as const;

type Activity = {
  id: string; type: string; title: string; description: string | null;
  due_at: string | null; done_at: string | null; created_at: string;
};
type LeadAct = Activity & { lead_id: string; leads: { name: string } | null };
type ProspAct = Activity & { prospect_id: string; institution_prospects: { trade_name: string } | null };

function ActivitiesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><ListChecks className="h-5 w-5" /> Atividades & tarefas</h2>
          <p className="text-sm text-muted-foreground">Ligações, e-mails, reuniões e follow-ups do comercial.</p>
        </div>
      </div>
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Em leads</TabsTrigger>
          <TabsTrigger value="prospects">Em instituições</TabsTrigger>
        </TabsList>
        <TabsContent value="leads"><LeadActivities /></TabsContent>
        <TabsContent value="prospects"><ProspectActivities /></TabsContent>
      </Tabs>
    </div>
  );
}

function LeadActivities() {
  const qc = useQueryClient();
  const { data: acts, isLoading } = useQuery({
    queryKey: ["lead-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("id, type, title, description, due_at, done_at, created_at, lead_id, leads(name)")
        .order("done_at", { ascending: true, nullsFirst: true })
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as LeadAct[];
    },
  });
  const { data: leads } = useQuery({
    queryKey: ["leads-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, name").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const doneMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_activities").update({ done_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-activities"] }),
  });

  return (
    <div className="space-y-3">
      <NewActivityDialog
        targets={(leads ?? []).map((l) => ({ id: l.id, name: l.name }))}
        targetLabel="Lead"
        onSubmit={async (payload) => {
          const { error } = await supabase.from("lead_activities").insert({
            lead_id: payload.target_id, type: payload.type as never, title: payload.title,
            description: payload.description || null, due_at: payload.due_at || null,
          });
          if (error) throw error;
        }}
        onCreated={() => qc.invalidateQueries({ queryKey: ["lead-activities"] })}
      />
      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <ActivityList items={(acts ?? []).map((a) => ({ ...a, subject: a.leads?.name ?? "—" }))} onDone={(id) => doneMut.mutate(id)} />
      )}
    </div>
  );
}

function ProspectActivities() {
  const qc = useQueryClient();
  const { data: acts, isLoading } = useQuery({
    queryKey: ["prospect-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_activities")
        .select("id, type, title, description, due_at, done_at, created_at, prospect_id, institution_prospects(trade_name)")
        .order("done_at", { ascending: true, nullsFirst: true })
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as ProspAct[];
    },
  });
  const { data: prospects } = useQuery({
    queryKey: ["prospects-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institution_prospects").select("id, trade_name").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const doneMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prospect_activities").update({ done_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospect-activities"] }),
  });

  return (
    <div className="space-y-3">
      <NewActivityDialog
        targets={(prospects ?? []).map((p) => ({ id: p.id, name: p.trade_name }))}
        targetLabel="Instituição"
        onSubmit={async (payload) => {
          const { error } = await supabase.from("prospect_activities").insert({
            prospect_id: payload.target_id, type: payload.type as never, title: payload.title,
            description: payload.description || null, due_at: payload.due_at || null,
          });
          if (error) throw error;
        }}
        onCreated={() => qc.invalidateQueries({ queryKey: ["prospect-activities"] })}
      />
      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <ActivityList items={(acts ?? []).map((a) => ({ ...a, subject: a.institution_prospects?.trade_name ?? "—" }))} onDone={(id) => doneMut.mutate(id)} />
      )}
    </div>
  );
}

function ActivityList({ items, onDone }: {
  items: Array<Activity & { subject: string }>;
  onDone: (id: string) => void;
}) {
  if (items.length === 0) return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma atividade.</div>;
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {items.map((a) => {
        const meta = ACT_TYPES.find((t) => t.value === a.type);
        const Icon = meta?.icon ?? FileText;
        const overdue = a.due_at && !a.done_at && new Date(a.due_at) < new Date();
        return (
          <div key={a.id} className="p-3 flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{a.title}</span>
                <Badge variant="outline" className="text-xs">{a.subject}</Badge>
                {a.done_at ? (
                  <Badge className="bg-success/15 text-success-foreground border-0 text-xs">Concluída</Badge>
                ) : overdue ? (
                  <Badge className="bg-destructive/15 text-destructive border-0 text-xs">Atrasada</Badge>
                ) : a.due_at ? (
                  <Badge variant="secondary" className="text-xs">{new Date(a.due_at).toLocaleString("pt-BR")}</Badge>
                ) : null}
              </div>
              {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
            </div>
            {!a.done_at && (
              <Button size="sm" variant="outline" onClick={() => onDone(a.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Concluir</Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewActivityDialog({ targets, targetLabel, onSubmit, onCreated }: {
  targets: { id: string; name: string }[];
  targetLabel: string;
  onSubmit: (payload: { target_id: string; type: string; title: string; description: string; due_at: string }) => Promise<void>;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target_id: "", type: "TASK", title: "", description: "", due_at: "" });
  const mut = useMutation({
    mutationFn: async () => {
      if (!form.target_id) throw new Error(`Selecione um(a) ${targetLabel.toLowerCase()}`);
      if (!form.title.trim()) throw new Error("Informe um título");
      await onSubmit(form);
    },
    onSuccess: () => {
      toast.success("Atividade criada");
      setOpen(false); setForm({ target_id: "", type: "TASK", title: "", description: "", due_at: "" }); onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova atividade</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>{targetLabel}</Label>
            <Select value={form.target_id} onValueChange={(v) => setForm({ ...form, target_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {targets.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={140} /></div>
          <div><Label>Descrição</Label><Textarea rows={3} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Prazo</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
