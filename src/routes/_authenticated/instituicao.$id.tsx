import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Plus, BookOpen, Tag, MapPin, Loader2, Pencil, Trash2, Save, Clock, CheckCircle2, AlertCircle, Ban, GraduationCap, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { COURSE_LEVEL_LABEL, MODALITY_LABEL, SHIFT_LABEL, formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/instituicao/$id")({
  component: ManageInstitutionPage,
  notFoundComponent: () => (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <h1 className="font-display text-xl font-bold">Instituição não encontrada</h1>
      <Button asChild className="mt-4"><Link to="/instituicao">Voltar</Link></Button>
    </div>
  ),
});

const STATUS: Record<string, { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Em análise", tone: "bg-warning/15 text-warning-foreground", icon: Clock },
  APPROVED: { label: "Aprovada", tone: "bg-primary-soft text-primary", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspensa", tone: "bg-destructive/15 text-destructive", icon: AlertCircle },
  REJECTED: { label: "Recusada", tone: "bg-muted text-muted-foreground", icon: Ban },
};

const LEVELS = ["FUNDAMENTAL","MEDIO","TECNICO","IDIOMAS","PROFISSIONALIZANTE","CURSO_LIVRE","PREPARATORIO","EJA","PRE_VESTIBULAR","GRADUACAO","POS_GRADUACAO","MBA","MESTRADO"];
const MODALITIES = ["PRESENCIAL","SEMIPRESENCIAL","EAD"];
const SHIFTS = ["MANHA","TARDE","NOITE","INTEGRAL","FLEXIVEL"];

function ManageInstitutionPage() {
  const { id } = Route.useParams();

  const { data: inst, isLoading } = useQuery({
    queryKey: ["institution", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="h-80 rounded-2xl bg-muted animate-pulse" />;
  if (!inst) return null;

  const meta = STATUS[inst.status] ?? STATUS.PENDING;
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <Link to="/instituicao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={meta.tone + " border-0"}>
              <Icon className="h-3 w-3 mr-1" /> {meta.label}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> {inst.trade_name}
          </h1>
          {inst.status === "PENDING" && (
            <p className="text-sm text-muted-foreground mt-1">
              Sua instituição está em análise. Você já pode cadastrar unidades, cursos e bolsas — eles ficarão ativos após a aprovação.
            </p>
          )}
        </div>
      </header>

      <Tabs defaultValue="matriculas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matriculas"><GraduationCap className="h-4 w-4 mr-1" /> Matrículas a efetivar</TabsTrigger>
          <TabsTrigger value="perfil"><Building2 className="h-4 w-4 mr-1" /> Perfil</TabsTrigger>
          <TabsTrigger value="unidades"><MapPin className="h-4 w-4 mr-1" /> Unidades</TabsTrigger>
          <TabsTrigger value="cursos"><BookOpen className="h-4 w-4 mr-1" /> Cursos & Turmas</TabsTrigger>
          <TabsTrigger value="bolsas"><Tag className="h-4 w-4 mr-1" /> Bolsas</TabsTrigger>
        </TabsList>

        <TabsContent value="matriculas"><EnrollmentsTab institutionId={id} /></TabsContent>
        <TabsContent value="perfil"><ProfileTab inst={inst} /></TabsContent>
        <TabsContent value="unidades"><UnitsTab institutionId={id} /></TabsContent>
        <TabsContent value="cursos"><CoursesTab institutionId={id} /></TabsContent>
        <TabsContent value="bolsas"><ScholarshipsTab institutionId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- Profile Tab ----------------
function ProfileTab({ inst }: { inst: any }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    trade_name: inst.trade_name ?? "",
    legal_name: inst.legal_name ?? "",
    email: inst.email ?? "",
    phone: inst.phone ?? "",
    website: inst.website ?? "",
    description: inst.description ?? "",
    logo_url: inst.logo_url ?? "",
  });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institutions").update(f).eq("id", inst.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institution", inst.id] });
      toast.success("Perfil atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldUI label="Nome fantasia"><Input value={f.trade_name} onChange={(e) => setF({...f, trade_name: e.target.value})} /></FieldUI>
        <FieldUI label="Razão social"><Input value={f.legal_name} onChange={(e) => setF({...f, legal_name: e.target.value})} /></FieldUI>
        <FieldUI label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({...f, email: e.target.value})} /></FieldUI>
        <FieldUI label="Telefone"><Input value={f.phone} onChange={(e) => setF({...f, phone: e.target.value})} /></FieldUI>
        <FieldUI label="Website" full><Input value={f.website} onChange={(e) => setF({...f, website: e.target.value})} /></FieldUI>
        <FieldUI label="URL do logo" full><Input value={f.logo_url} onChange={(e) => setF({...f, logo_url: e.target.value})} placeholder="https://..." /></FieldUI>
        <FieldUI label="Descrição" full><Textarea rows={4} value={f.description} onChange={(e) => setF({...f, description: e.target.value})} /></FieldUI>
      </div>
      <Button type="submit" disabled={save.isPending} className="gap-2">
        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar perfil
      </Button>
    </form>
  );
}

// ---------------- Units Tab ----------------
function UnitsTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", city: "", state: "", address: "", phone: "" });

  const { data: units } = useQuery({
    queryKey: ["units", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("institution_units").select("*").eq("institution_id", institutionId).order("is_main", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institution_units").insert({
        institution_id: institutionId, name: f.name, city: f.city, state: f.state.toUpperCase().slice(0,2),
        address: f.address || null, phone: f.phone || null, is_main: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units", institutionId] });
      toast.success("Unidade criada");
      setOpen(false);
      setF({ name: "", city: "", state: "", address: "", phone: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units", institutionId] });
      toast.success("Unidade removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova unidade</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova unidade</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <FieldUI label="Nome"><Input value={f.name} onChange={(e) => setF({...f, name: e.target.value})} /></FieldUI>
              <div className="grid grid-cols-2 gap-3">
                <FieldUI label="Cidade"><Input value={f.city} onChange={(e) => setF({...f, city: e.target.value})} /></FieldUI>
                <FieldUI label="UF"><Input maxLength={2} value={f.state} onChange={(e) => setF({...f, state: e.target.value.toUpperCase()})} /></FieldUI>
              </div>
              <FieldUI label="Endereço"><Input value={f.address} onChange={(e) => setF({...f, address: e.target.value})} /></FieldUI>
              <FieldUI label="Telefone"><Input value={f.phone} onChange={(e) => setF({...f, phone: e.target.value})} /></FieldUI>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending || !f.name || !f.city || !f.state}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {units?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>}
        {units?.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold flex items-center gap-2">
                {u.name}
                {u.is_main && <Badge variant="secondary">Principal</Badge>}
              </div>
              <div className="text-sm text-muted-foreground truncate">{u.city}/{u.state} · {u.address ?? "—"}</div>
            </div>
            {!u.is_main && (
              <Button variant="ghost" size="sm" onClick={() => del.mutate(u.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Courses Tab ----------------
function CoursesTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["courses", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, slug, name, level, modality, shift, original_price, is_active, course_offerings(id, vacancies_total, status, institution_unit:institution_units(name, city, state))")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units-options", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("institution_units").select("id, name, city, state").eq("institution_id", institutionId);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewCourseDialog
          institutionId={institutionId}
          units={units ?? []}
          open={open}
          setOpen={setOpen}
          onCreated={() => qc.invalidateQueries({ queryKey: ["courses", institutionId] })}
        />
      </div>

      <div className="space-y-2">
        {courses?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum curso cadastrado. Crie seu primeiro curso e adicione turmas.</p>
        )}
        {courses?.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                  <Badge variant="secondary">{COURSE_LEVEL_LABEL[c.level] ?? c.level}</Badge>
                  <Badge variant="secondary">{MODALITY_LABEL[c.modality] ?? c.modality}</Badge>
                  <Badge variant="secondary">{SHIFT_LABEL[c.shift] ?? c.shift}</Badge>
                  <span className="text-foreground/70">Mensalidade cheia: <strong>{formatBRL(Number(c.original_price))}</strong></span>
                </div>
              </div>
              <NewOfferingDialog courseId={c.id} units={units ?? []} onCreated={() => qc.invalidateQueries({ queryKey: ["courses", institutionId] })} />
            </div>
            {c.course_offerings && c.course_offerings.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-border space-y-1.5">
                {c.course_offerings.map((o: any) => (
                  <div key={o.id} className="text-sm flex items-center gap-2">
                    <Badge variant="outline">{o.status}</Badge>
                    <span className="text-muted-foreground">
                      {o.institution_unit?.name} · {o.institution_unit?.city}/{o.institution_unit?.state} · {o.vacancies_total} vagas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewCourseDialog({
  institutionId, units, open, setOpen, onCreated,
}: { institutionId: string; units: any[]; open: boolean; setOpen: (v: boolean) => void; onCreated: () => void }) {
  const [f, setF] = useState({
    name: "", level: "GRADUACAO", modality: "PRESENCIAL", shift: "NOITE",
    original_price: "", duration_months: "", description: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const { error } = await supabase.from("courses").insert({
        institution_id: institutionId,
        slug,
        name: f.name,
        level: f.level as any,
        modality: f.modality as any,
        shift: f.shift as any,
        original_price: Number(f.original_price),
        duration_months: f.duration_months ? Number(f.duration_months) : null,
        description: f.description || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Curso criado");
      setOpen(false);
      setF({ name: "", level: "GRADUACAO", modality: "PRESENCIAL", shift: "NOITE", original_price: "", duration_months: "", description: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo curso</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo curso</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <FieldUI label="Nome do curso"><Input value={f.name} onChange={(e) => setF({...f, name: e.target.value})} /></FieldUI>
          <div className="grid grid-cols-3 gap-3">
            <FieldUI label="Nível">
              <SelectUI value={f.level} onChange={(v) => setF({...f, level: v})} options={LEVELS.map((l) => ({ value: l, label: COURSE_LEVEL_LABEL[l] ?? l }))} />
            </FieldUI>
            <FieldUI label="Modalidade">
              <SelectUI value={f.modality} onChange={(v) => setF({...f, modality: v})} options={MODALITIES.map((l) => ({ value: l, label: MODALITY_LABEL[l] ?? l }))} />
            </FieldUI>
            <FieldUI label="Turno">
              <SelectUI value={f.shift} onChange={(v) => setF({...f, shift: v})} options={SHIFTS.map((l) => ({ value: l, label: SHIFT_LABEL[l] ?? l }))} />
            </FieldUI>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldUI label="Mensalidade cheia (R$)">
              <Input type="number" min="0" step="0.01" value={f.original_price} onChange={(e) => setF({...f, original_price: e.target.value})} />
            </FieldUI>
            <FieldUI label="Duração (meses)">
              <Input type="number" min="0" value={f.duration_months} onChange={(e) => setF({...f, duration_months: e.target.value})} />
            </FieldUI>
          </div>
          <FieldUI label="Descrição"><Textarea rows={3} value={f.description} onChange={(e) => setF({...f, description: e.target.value})} /></FieldUI>
          {units.length === 0 && (
            <p className="text-xs text-warning-foreground">Cadastre uma unidade antes de criar turmas para este curso.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !f.name || !f.original_price}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar curso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewOfferingDialog({ courseId, units, onCreated }: { courseId: string; units: any[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ institution_unit_id: "", vacancies_total: "10" });

  const create = useMutation({
    mutationFn: async () => {
      const total = Number(f.vacancies_total);
      const { error } = await supabase.from("course_offerings").insert({
        course_id: courseId,
        institution_unit_id: f.institution_unit_id,
        vacancies_total: total,
        vacancies_available: total,
        status: "ACTIVE",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Turma criada");
      setOpen(false);
      setF({ institution_unit_id: "", vacancies_total: "10" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1" disabled={units.length === 0}>
          <Plus className="h-3.5 w-3.5" /> Turma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova turma</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <FieldUI label="Unidade">
            <SelectUI value={f.institution_unit_id} onChange={(v) => setF({...f, institution_unit_id: v})}
              options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.city}/${u.state})` }))}
              placeholder="Selecione" />
          </FieldUI>
          <FieldUI label="Vagas totais">
            <Input type="number" min="1" value={f.vacancies_total} onChange={(e) => setF({...f, vacancies_total: e.target.value})} />
          </FieldUI>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !f.institution_unit_id || !f.vacancies_total}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar turma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Scholarships Tab ----------------
function ScholarshipsTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: offerings } = useQuery({
    queryKey: ["offerings-options", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_offerings")
        .select(`
          id, vacancies_total,
          course:courses!inner(id, name, original_price, institution_id),
          institution_unit:institution_units!inner(name, city, state)
        `)
        .eq("course.institution_id", institutionId)
        .eq("status", "ACTIVE");
      return data ?? [];
    },
  });

  const { data: scholarships } = useQuery({
    queryKey: ["scholarships", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("scholarships")
        .select(`
          id, title, discount_type, discount_value, price_with_scholarship, is_active, is_featured, start_at, end_at,
          course_offering:course_offerings!inner(
            course:courses!inner(name, original_price, institution_id),
            institution_unit:institution_units!inner(name, city, state)
          )
        `)
        .eq("course_offering.course.institution_id", institutionId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("scholarships").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scholarships", institutionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewScholarshipDialog
          offerings={offerings ?? []}
          open={open}
          setOpen={setOpen}
          onCreated={() => qc.invalidateQueries({ queryKey: ["scholarships", institutionId] })}
        />
      </div>

      <div className="space-y-2">
        {scholarships?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma bolsa cadastrada. Crie sua primeira bolsa para começar a receber reservas.
          </p>
        )}
        {scholarships?.map((s) => {
          const original = Number(s.course_offering?.course?.original_price ?? 0);
          const final = Number(s.price_with_scholarship);
          const pct = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold">{s.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {s.course_offering?.course?.name} · {s.course_offering?.institution_unit?.name}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground border-0">{pct}% OFF</Badge>
                  <span className="text-sm font-bold text-primary">{formatBRL(final)}/mês</span>
                  <span className="text-xs text-muted-foreground line-through">{formatBRL(original)}</span>
                </div>
              </div>
              <Button
                variant={s.is_active ? "outline" : "default"}
                size="sm"
                onClick={() => toggleActive.mutate({ id: s.id, value: !s.is_active })}
              >
                {s.is_active ? "Pausar" : "Ativar"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewScholarshipDialog({
  offerings, open, setOpen, onCreated,
}: { offerings: any[]; open: boolean; setOpen: (v: boolean) => void; onCreated: () => void }) {
  const [f, setF] = useState({
    course_offering_id: "", title: "", discount_type: "PERCENT" as "PERCENT" | "FIXED" | "FINAL_PRICE",
    discount_value: "", end_at: "", rules: "",
  });

  const selected = offerings.find((o) => o.id === f.course_offering_id);
  const original = Number(selected?.course?.original_price ?? 0);
  const value = Number(f.discount_value) || 0;
  const finalPrice =
    f.discount_type === "PERCENT" ? Math.max(0, original * (1 - value / 100))
    : f.discount_type === "FIXED" ? Math.max(0, original - value)
    : value;

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scholarships").insert({
        course_offering_id: f.course_offering_id,
        title: f.title,
        discount_type: f.discount_type as any,
        discount_value: value,
        price_with_scholarship: finalPrice,
        end_at: f.end_at ? new Date(f.end_at).toISOString() : null,
        rules: f.rules || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bolsa criada");
      setOpen(false);
      setF({ course_offering_id: "", title: "", discount_type: "PERCENT", discount_value: "", end_at: "", rules: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={offerings.length === 0}>
          <Plus className="h-4 w-4" /> Nova bolsa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova bolsa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <FieldUI label="Turma">
            <SelectUI
              value={f.course_offering_id}
              onChange={(v) => setF({...f, course_offering_id: v})}
              placeholder="Selecione uma turma"
              options={offerings.map((o) => ({
                value: o.id,
                label: `${o.course?.name} · ${o.institution_unit?.name} (${formatBRL(Number(o.course?.original_price))})`,
              }))}
            />
          </FieldUI>
          <FieldUI label="Título"><Input value={f.title} onChange={(e) => setF({...f, title: e.target.value})} placeholder="Ex.: Bolsa de inverno 2026" /></FieldUI>
          <div className="grid grid-cols-2 gap-3">
            <FieldUI label="Tipo de desconto">
              <SelectUI value={f.discount_type} onChange={(v) => setF({...f, discount_type: v as any})}
                options={[
                  { value: "PERCENT", label: "Porcentagem (%)" },
                  { value: "FIXED", label: "Valor fixo (R$)" },
                  { value: "FINAL_PRICE", label: "Preço final (R$)" },
                ]}
              />
            </FieldUI>
            <FieldUI label="Valor">
              <Input type="number" min="0" step="0.01" value={f.discount_value} onChange={(e) => setF({...f, discount_value: e.target.value})} />
            </FieldUI>
          </div>
          {selected && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              Mensalidade original: <strong>{formatBRL(original)}</strong> →
              {" "}<span className="text-primary font-bold">{formatBRL(finalPrice)}</span>
            </div>
          )}
          <FieldUI label="Validade (opcional)">
            <Input type="date" value={f.end_at} onChange={(e) => setF({...f, end_at: e.target.value})} />
          </FieldUI>
          <FieldUI label="Regras"><Textarea rows={2} value={f.rules} onChange={(e) => setF({...f, rules: e.target.value})} /></FieldUI>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !f.course_offering_id || !f.title || !f.discount_value}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar bolsa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Shared UI ----------------
function FieldUI({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SelectUI({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder ?? "Selecione"} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------------- Enrollments Tab ----------------
function EnrollmentsTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inst-reservations", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reservation_code, status, payment_status, amount_paid, created_at, user_id, scholarship_id, course_offering_id")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const confirmMut = useMutation({
    mutationFn: async ({ id, approve, notes }: { id: string; approve: boolean; notes?: string }) => {
      const { error } = await supabase.rpc("confirm_enrollment", {
        p_reservation_id: id, p_approve: approve, p_notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inst-reservations", institutionId] });
      toast.success("Status atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  const rows = data ?? [];
  const pending = rows.filter((r) => r.payment_status === "PAID" && ["CONFIRMED","AWAITING_ENROLLMENT","UNDER_REVIEW"].includes(r.status));
  const done = rows.filter((r) => ["ENROLLMENT_APPROVED","ENROLLMENT_REJECTED"].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold mb-1">Como funciona</h2>
        <p className="text-sm text-muted-foreground">
          O aluno paga a <strong>taxa de matrícula ao Tô de Bolsa</strong>. Quando o pagamento é confirmado, a reserva entra
          nesta fila para você <strong>efetivar a matrícula</strong> no sistema da sua instituição. Após efetivada, marque como
          aprovada — o aluno é notificado automaticamente.
        </p>
      </div>

      <section>
        <h3 className="font-display text-base font-bold mb-3">A efetivar ({pending.length})</h3>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma matrícula aguardando efetivação no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <EnrollmentRow key={r.id} r={r} onApprove={() => confirmMut.mutate({ id: r.id, approve: true })}
                onReject={(notes) => confirmMut.mutate({ id: r.id, approve: false, notes })} loading={confirmMut.isPending} />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h3 className="font-display text-base font-bold mb-3">Histórico</h3>
          <div className="space-y-2">
            {done.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  {r.status === "ENROLLMENT_APPROVED" ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{r.reservation_code}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.status === "ENROLLMENT_APPROVED" ? "Matrícula efetivada" : "Matrícula recusada"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatBRL(Number(r.amount_paid ?? 0))}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EnrollmentRow({ r, onApprove, onReject, loading }: {
  r: { id: string; reservation_code: string; status: string; amount_paid: number | null; created_at: string };
  onApprove: () => void; onReject: (notes: string) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-semibold text-sm">{r.reservation_code}</div>
        <div className="text-xs text-muted-foreground">
          Pago em {new Date(r.created_at).toLocaleDateString("pt-BR")} · {formatBRL(Number(r.amount_paid ?? 0))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApprove} disabled={loading}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Efetivar matrícula
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={loading}>
              <XCircle className="h-4 w-4 mr-1" /> Recusar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Recusar matrícula</DialogTitle></DialogHeader>
            <Label>Motivo (será enviado ao aluno)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={500} />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { onReject(notes); setOpen(false); }}>Confirmar recusa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
