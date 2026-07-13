import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Plus, BookOpen, Tag, MapPin, Loader2, Pencil, Trash2, Save, Clock, CheckCircle2, AlertCircle, Ban, GraduationCap, XCircle, Upload, DollarSign } from "lucide-react";
import { FinanceTab } from "@/components/institution/FinanceTab";
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
import { COURSE_LEVEL_LABEL, MODALITY_LABEL, SHIFT_LABEL, formatBRL, KNOWLEDGE_AREAS } from "@/lib/format";

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
        <Button asChild variant="outline" className="gap-2">
          <Link to="/instituicao/importar-bolsas">
            <Upload className="h-4 w-4" /> Importar bolsas (CSV)
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="bolsas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bolsas"><Tag className="h-4 w-4 mr-1" /> Bolsas</TabsTrigger>
          <TabsTrigger value="matriculas"><GraduationCap className="h-4 w-4 mr-1" /> Matrículas a efetivar</TabsTrigger>
          <TabsTrigger value="unidades"><MapPin className="h-4 w-4 mr-1" /> Unidades</TabsTrigger>
          <TabsTrigger value="perfil"><Building2 className="h-4 w-4 mr-1" /> Perfil</TabsTrigger>
          <TabsTrigger value="financeiro"><DollarSign className="h-4 w-4 mr-1" /> Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="bolsas"><ScholarshipsTab institutionId={id} /></TabsContent>
        <TabsContent value="matriculas"><EnrollmentsTab institutionId={id} /></TabsContent>
        <TabsContent value="unidades"><UnitsTab institutionId={id} /></TabsContent>
        <TabsContent value="perfil"><ProfileTab inst={inst} /></TabsContent>
        <TabsContent value="financeiro"><FinanceTab institutionId={id} /></TabsContent>
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
type UnitRow = { id: string; name: string; city: string; state: string; address: string | null; phone: string | null; is_main: boolean };

function UnitsTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const empty = { name: "", city: "", state: "", address: "", phone: "" };
  const [f, setF] = useState(empty);

  const { data: units } = useQuery({
    queryKey: ["units", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("institution_units").select("*").eq("institution_id", institutionId).order("is_main", { ascending: false });
      return (data ?? []) as UnitRow[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setF(empty);
    setOpen(true);
  };
  const openEdit = (u: UnitRow) => {
    setEditing(u);
    setF({ name: u.name, city: u.city, state: u.state, address: u.address ?? "", phone: u.phone ?? "" });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name,
        city: f.city,
        state: f.state.toUpperCase().slice(0, 2),
        address: f.address || null,
        phone: f.phone || null,
      };
      if (editing) {
        const { error } = await supabase.from("institution_units").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institution_units").insert({
          institution_id: institutionId, ...payload, is_main: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units", institutionId] });
      toast.success(editing ? "Unidade atualizada" : "Unidade criada");
      setOpen(false);
      setEditing(null);
      setF(empty);
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
    onError: (e: Error) =>
      toast.error(
        /foreign key|violates/i.test(e.message)
          ? "Existem bolsas/turmas vinculadas a esta unidade. Remova-as ou pause-as antes de excluir."
          : e.message,
      ),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setF(empty); } }}>
          <DialogTrigger asChild><Button className="gap-2" onClick={openNew}><Plus className="h-4 w-4" /> Nova unidade</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar unidade" : "Nova unidade"}</DialogTitle></DialogHeader>
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
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !f.name || !f.city || !f.state}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {editing ? "Salvar" : "Criar"}
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              {!u.is_main && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Excluir a unidade "${u.name}"?`)) del.mutate(u.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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
    name: "", level: "GRADUACAO", area: "", modality: "PRESENCIAL", shift: "NOITE",
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
        area: f.area || null,
        modality: f.modality as any,
        shift: f.shift as any,
        original_price: Number(f.original_price),
        duration_months: f.duration_months ? Number(f.duration_months) : null,
        description: f.description || null,
        is_active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Curso criado");
      setOpen(false);
      setF({ name: "", level: "GRADUACAO", area: "", modality: "PRESENCIAL", shift: "NOITE", original_price: "", duration_months: "", description: "" });
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
          <FieldUI label="Área de conhecimento">
            <SelectUI
              value={f.area}
              onChange={(v) => setF({...f, area: v})}
              options={[{ value: "", label: "Selecione uma área" }, ...KNOWLEDGE_AREAS.map((a) => ({ value: a.slug, label: a.label }))]}
            />
          </FieldUI>
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
type ScholarshipRow = {
  id: string;
  title: string;
  discount_type: "PERCENT" | "FIXED" | "FINAL_PRICE";
  discount_value: number;
  price_with_scholarship: number;
  is_active: boolean;
  is_featured: boolean;
  end_at: string | null;
  rules: string | null;
  max_uses: number | null;
  duration_months: number | null;
  price_mode: "MONTHLY" | "UPFRONT" | null;
  installments_count: number | null;
  course_offering: {
    id: string;
    institution_unit: { id: string; name: string; city: string; state: string };
    course: {
      id: string;
      name: string;
      level: string;
      modality: string;
      shift: string;
      area: string | null;
      original_price: number;
      institution_id: string;
    };
  } | null;
};

function ScholarshipsTab({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScholarshipRow | null>(null);
  const [q, setQ] = useState("");
  const [fLevel, setFLevel] = useState("");
  const [fModality, setFModality] = useState("");
  const [fShift, setFShift] = useState("");
  const [fArea, setFArea] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  const { data: units } = useQuery({
    queryKey: ["institution-units-options", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_units")
        .select("id, name, city, state")
        .eq("institution_id", institutionId)
        .order("is_main", { ascending: false });
      return data ?? [];
    },
  });

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ["scholarships", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("scholarships")
        .select(`
          id, title, discount_type, discount_value, price_with_scholarship, is_active, is_featured,
          end_at, rules, max_uses, duration_months, price_mode, installments_count,
          course_offering:course_offerings!inner(
            id,
            institution_unit:institution_units!inner(id, name, city, state),
            course:courses!inner(id, name, level, modality, shift, area, original_price, institution_id)
          )
        `)
        .eq("course_offering.course.institution_id", institutionId)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as ScholarshipRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("scholarships").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scholarships", institutionId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("institution_delete_scholarship", { p_scholarship_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bolsa removida.");
      qc.invalidateQueries({ queryKey: ["scholarships", institutionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (scholarships ?? []).filter((s) => {
    const c = s.course_offering?.course;
    const u = s.course_offering?.institution_unit;
    if (q && !s.title.toLowerCase().includes(q.toLowerCase()) && !(c?.name ?? "").toLowerCase().includes(q.toLowerCase())) return false;
    if (fLevel && c?.level !== fLevel) return false;
    if (fModality && c?.modality !== fModality) return false;
    if (fShift && c?.shift !== fShift) return false;
    if (fArea && (c?.area ?? "") !== fArea) return false;
    if (fUnit && u?.id !== fUnit) return false;
    if (fStatus === "ACTIVE" && !s.is_active) return false;
    if (fStatus === "PAUSED" && s.is_active) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/instituicao/importar-bolsas">
            <Upload className="h-4 w-4" /> Importar bolsas (CSV)
          </Link>
        </Button>
        <Button className="gap-2" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova bolsa
        </Button>
      </div>

      <ScholarshipFormDialog
        open={open}
        setOpen={setOpen}
        institutionId={institutionId}
        units={units ?? []}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["scholarships", institutionId] })}
      />

      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Input
            placeholder="Buscar por título ou curso..."
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
          />
          <Select value={fLevel || "ALL"} onValueChange={(v) => { setFLevel(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os níveis</SelectItem>
              {LEVELS.map((l) => <SelectItem key={l} value={l}>{COURSE_LEVEL_LABEL[l] ?? l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fModality || "ALL"} onValueChange={(v) => { setFModality(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as modalidades</SelectItem>
              {MODALITIES.map((m) => <SelectItem key={m} value={m}>{MODALITY_LABEL[m] ?? m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fShift || "ALL"} onValueChange={(v) => { setFShift(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os turnos</SelectItem>
              {SHIFTS.map((s) => <SelectItem key={s} value={s}>{SHIFT_LABEL[s] ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fArea || "ALL"} onValueChange={(v) => { setFArea(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as áreas</SelectItem>
              {KNOWLEDGE_AREAS.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fUnit || "ALL"} onValueChange={(v) => { setFUnit(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as unidades</SelectItem>
              {(units ?? []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus || "ALL"} onValueChange={(v) => { setFStatus(v === "ALL" ? "" : v); resetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="ACTIVE">Ativas</SelectItem>
              <SelectItem value="PAUSED">Pausadas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => { setQ(""); setFLevel(""); setFModality(""); setFShift(""); setFArea(""); setFUnit(""); setFStatus(""); resetPage(); }}
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="h-20 rounded-2xl bg-muted animate-pulse" />}
        {!isLoading && total === 0 && (
          <p className="text-sm text-muted-foreground">
            {(scholarships?.length ?? 0) === 0
              ? "Nenhuma bolsa cadastrada. Crie sua primeira bolsa para começar a receber reservas."
              : "Nenhuma bolsa encontrada com os filtros aplicados."}
          </p>
        )}
        {pageRows.map((s) => {
          const original = Number(s.course_offering?.course?.original_price ?? 0);
          const final = Number(s.price_with_scholarship);
          const pct = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
          const unit = s.course_offering?.institution_unit;
          const isEad = s.course_offering?.course?.modality === "EAD";
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold">{s.title}</div>
                  {!s.is_active && <Badge variant="outline" className="text-xs">Pausada</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {COURSE_LEVEL_LABEL[s.course_offering?.course?.level ?? ""] ?? s.course_offering?.course?.level}
                  {" · "}{MODALITY_LABEL[s.course_offering?.course?.modality ?? ""] ?? s.course_offering?.course?.modality}
                  {isEad ? " · Online" : unit ? ` · ${unit.name}${unit.city ? ` (${unit.city}/${unit.state})` : ""}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground border-0">{pct}% OFF</Badge>
                  <span className="text-sm font-bold text-primary">
                    {formatBRL(final)}{s.price_mode === "MONTHLY" ? "/mês" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">{formatBRL(original)}</span>
                  {s.duration_months ? (
                    <span className="text-xs text-muted-foreground">· {s.duration_months} meses</span>
                  ) : null}
                  {s.installments_count ? (
                    <span className="text-xs text-muted-foreground">
                      · {s.installments_count}{s.price_mode === "MONTHLY" ? " mensalidades" : "x"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(s); setOpen(true); }}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button
                  variant={s.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleActive.mutate({ id: s.id, value: !s.is_active })}
                >
                  {s.is_active ? "Pausar" : "Ativar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Remover a bolsa "${s.title}"? Se houver reservas, ela será desativada em vez de excluída.`)) {
                      del.mutate(s.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {start + 1}–{Math.min(start + pageSize, total)} de {total}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Por página:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); resetPage(); }}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Anterior
            </Button>
            <span className="text-sm">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


function ScholarshipFormDialog({
  open, setOpen, institutionId, units, editing, onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  institutionId: string;
  units: Array<{ id: string; name: string; city: string; state: string }>;
  editing: ScholarshipRow | null;
  onSaved: () => void;
}) {
  const empty = {
    title: "",
    level: "GRADUACAO",
    modality: "PRESENCIAL",
    shift: "FLEXIVEL",
    area: "",
    institution_unit_id: "",
    original_price: "",
    discount_type: "PERCENT" as "PERCENT" | "FIXED",
    discount_value: "",
    vacancies: "10",
    end_at: "",
    rules: "",
    is_active: true,
    duration_value: "",
    duration_unit: "MESES" as "HORAS" | "MESES" | "ANOS",
    price_mode: "MONTHLY" as "MONTHLY" | "UPFRONT",
    installments_count: "",
  };
  const [f, setF] = useState(empty);

  // Sync form once per opened editing row (fix: previous inline setState re-ran on every keystroke, blocking title edits)
  useEffect(() => {
    if (!open) return;
    if (!editing) { setF(empty); return; }
    const c = editing.course_offering?.course;
    const raw = editing as unknown as { duration_value?: number | string | null; duration_unit?: string | null };
    setF({
      title: editing.title ?? "",
      level: c?.level ?? "GRADUACAO",
      modality: c?.modality ?? "PRESENCIAL",
      shift: c?.shift ?? "FLEXIVEL",
      area: c?.area ?? "",
      institution_unit_id: editing.course_offering?.institution_unit?.id ?? "",
      original_price: String(c?.original_price ?? ""),
      discount_type: (editing.discount_type === "FIXED" ? "FIXED" : "PERCENT"),
      discount_value: String(editing.discount_value ?? ""),
      vacancies: String(editing.max_uses ?? 10),
      end_at: editing.end_at ? editing.end_at.slice(0, 10) : "",
      rules: editing.rules ?? "",
      is_active: editing.is_active,
      duration_value: raw.duration_value != null
        ? String(raw.duration_value)
        : (editing.duration_months ? String(editing.duration_months) : ""),
      duration_unit: ((raw.duration_unit as "HORAS" | "MESES" | "ANOS") ?? "MESES"),
      price_mode: (editing.price_mode ?? "MONTHLY") as "MONTHLY" | "UPFRONT",
      installments_count: editing.installments_count ? String(editing.installments_count) : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id, open]);

  const original = Number(f.original_price) || 0;
  const value = Number(f.discount_value) || 0;
  const finalPrice =
    f.discount_type === "PERCENT" ? Math.max(0, original * (1 - value / 100))
    : Math.max(0, original - value);

  const isEad = f.modality === "EAD";
  const isMonthly = f.price_mode === "MONTHLY";

  // ---- Validações (Fase 7) ----
  const errors: string[] = [];
  const warnings: string[] = [];
  if (f.original_price !== "" && original < 0) errors.push("O valor cheio não pode ser negativo.");
  if (f.discount_value !== "" && value < 0) errors.push("O desconto não pode ser negativo.");
  if (f.discount_type === "PERCENT" && value > 100) {
    errors.push("O percentual de desconto não pode ser maior que 100%.");
  }
  if (f.discount_type === "FIXED" && original > 0 && value > original) {
    errors.push("O desconto em R$ não pode ser maior que o valor cheio.");
  }
  if (original > 0 && value > 0 && finalPrice >= original) {
    errors.push("O valor com bolsa precisa ser menor que o valor cheio.");
  }
  const effectivePercent =
    f.discount_type === "PERCENT"
      ? value
      : original > 0
      ? ((original - finalPrice) / original) * 100
      : 0;
  if (effectivePercent > 90 && effectivePercent <= 100) {
    warnings.push(
      "Desconto acima de 90%. Confirme com o time comercial se essa condição está correta antes de publicar.",
    );
  }
  const hasBlockingError = errors.length > 0;
  const installmentsNum = Number(f.installments_count) || 0;
  const durationNum = Number(f.duration_value) || 0;
  // Só calculamos economia total quando temos parcelas E, no modo mensal, duração confirmada.
  const canShowTotals = installmentsNum > 0 && (!isMonthly || durationNum > 0);

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("institution_save_scholarship", {
        p_scholarship_id: editing?.id ?? null,
        p_institution_id: institutionId,
        p_title: f.title.trim(),
        p_level: f.level,
        p_modality: f.modality,
        p_shift: f.shift,
        p_area: f.area || "",
        p_institution_unit_id: (!f.institution_unit_id || f.institution_unit_id === "__none__") ? null : f.institution_unit_id,
        p_original_price: original,
        p_discount_type: f.discount_type,
        p_discount_value: value,
        p_vacancies: Number(f.vacancies) || 1,
        p_end_at: f.end_at ? new Date(f.end_at).toISOString() : null,
        p_rules: f.rules || "",
        p_is_active: f.is_active,
        p_duration_value: f.duration_value ? Number(f.duration_value) : null,
        p_duration_unit: f.duration_value ? f.duration_unit : null,
        p_price_mode: f.price_mode,
        p_installments_count: f.installments_count ? Number(f.installments_count) : null,
      } as never);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(editing ? "Bolsa atualizada." : "Bolsa criada.");
      setOpen(false);
      setF(empty);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setF(empty);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar bolsa" : "Nova bolsa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FieldUI label="Nome do curso">
            <Input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Ex.: Administração"
            />
          </FieldUI>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldUI label="Nível">
              <SelectUI
                value={f.level}
                onChange={(v) => setF({ ...f, level: v })}
                options={LEVELS.map((l) => ({ value: l, label: COURSE_LEVEL_LABEL[l] ?? l }))}
              />
            </FieldUI>
            <FieldUI label="Modalidade">
              <SelectUI
                value={f.modality}
                onChange={(v) => setF({ ...f, modality: v })}
                options={MODALITIES.map((m) => ({ value: m, label: MODALITY_LABEL[m] ?? m }))}
              />
            </FieldUI>
            <FieldUI label="Turno">
              <SelectUI
                value={f.shift}
                onChange={(v) => setF({ ...f, shift: v })}
                options={SHIFTS.map((s) => ({ value: s, label: SHIFT_LABEL[s] ?? s }))}
              />
            </FieldUI>
            <FieldUI label="Área de conhecimento">
              <SelectUI
                value={f.area}
                onChange={(v) => setF({ ...f, area: v })}
                placeholder="Selecione uma área (opcional)"
                options={KNOWLEDGE_AREAS.map((a) => ({ value: a.slug, label: a.label }))}
              />
            </FieldUI>
          </div>
          <FieldUI label={isEad ? "Unidade (opcional para EAD)" : "Unidade"}>
            <SelectUI
              value={f.institution_unit_id}
              onChange={(v) => setF({ ...f, institution_unit_id: v })}
              placeholder={
                units.length === 0
                  ? (isEad ? "Sem unidade específica (100% online)" : "Cadastre uma unidade primeiro")
                  : (isEad ? "Sem unidade específica (100% online)" : "Selecione a unidade")
              }
              options={[
                ...(isEad ? [{ value: "__none__", label: "Sem unidade específica (100% online)" }] : []),
                ...units.map((u) => ({ value: u.id, label: `${u.name}${u.city ? ` — ${u.city}/${u.state}` : ""}` })),
              ]}
            />
            {isEad && (
              <p className="text-xs text-muted-foreground mt-1">
                Para bolsas 100% online você pode deixar sem unidade ou vincular a uma existente.
              </p>
            )}
          </FieldUI>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldUI label="Duração do curso">
              <div className="flex gap-2">
                <Input
                  type="number" min="0" step="0.5"
                  value={f.duration_value}
                  onChange={(e) => setF({ ...f, duration_value: e.target.value })}
                  placeholder="Ex.: 48"
                  className="flex-1"
                />
                <div className="w-32">
                  <SelectUI
                    value={f.duration_unit}
                    onChange={(v) => setF({ ...f, duration_unit: v as "HORAS" | "MESES" | "ANOS" })}
                    options={[
                      { value: "HORAS", label: "Horas" },
                      { value: "MESES", label: "Meses" },
                      { value: "ANOS", label: "Anos" },
                    ]}
                  />
                </div>
              </div>
            </FieldUI>
            <FieldUI label="Vagas">
              <Input
                type="number" min="1"
                value={f.vacancies}
                onChange={(e) => setF({ ...f, vacancies: e.target.value })}
              />
            </FieldUI>
            <FieldUI label="Tipo de cobrança">
              <SelectUI
                value={f.price_mode}
                onChange={(v) => setF({ ...f, price_mode: v as "MONTHLY" | "UPFRONT" })}
                options={[
                  { value: "MONTHLY", label: "Mensalidade" },
                  { value: "UPFRONT", label: "Preço cheio (valor total)" },
                ]}
              />
            </FieldUI>
            <FieldUI label={isMonthly ? "Qtd. de mensalidades" : "Qtd. de parcelas"}>
              <Input
                type="number" min="1"
                value={f.installments_count}
                onChange={(e) => setF({ ...f, installments_count: e.target.value })}
                placeholder={isMonthly ? "Ex.: 48" : "Ex.: 12"}
              />
            </FieldUI>
            <FieldUI label={isMonthly ? "Valor da mensalidade (R$)" : "Valor cheio do curso (R$)"}>
              <Input
                type="number" min="0" step="0.01"
                value={f.original_price}
                onChange={(e) => setF({ ...f, original_price: e.target.value })}
                placeholder={isMonthly ? "Ex.: 1200,00" : "Ex.: 24000,00"}
              />
            </FieldUI>
            <FieldUI label="Tipo de desconto">
              <SelectUI
                value={f.discount_type}
                onChange={(v) => setF({ ...f, discount_type: v as "PERCENT" | "FIXED" })}
                options={[
                  { value: "PERCENT", label: "Percentual (%) sobre o valor" },
                  { value: "FIXED", label: "Valor fixo (R$) de desconto" },
                ]}
              />
            </FieldUI>
            <FieldUI label={
              f.discount_type === "PERCENT" ? "Percentual de desconto (%)" : "Valor do desconto (R$)"
            }>
              <Input
                type="number" min="0" step="0.01"
                value={f.discount_value}
                onChange={(e) => setF({ ...f, discount_value: e.target.value })}
              />
            </FieldUI>
          </div>

          {original > 0 && value > 0 && (() => {
            const installments = Number(f.installments_count) || 0;
            const total = isMonthly ? finalPrice * (installments || 1) : finalPrice;
            const totalOriginal = isMonthly ? original * (installments || 1) : original;
            return (
              <div className="rounded-lg bg-secondary p-3 text-sm space-y-1">
                <div>
                  De <strong>{formatBRL(original)}</strong>
                  {isMonthly ? "/mês" : ""} por{" "}
                  <span className="text-primary font-bold">{formatBRL(finalPrice)}</span>
                  {isMonthly ? "/mês" : ""}
                  {original > finalPrice && (
                    <span className="ml-2 text-muted-foreground">
                      ({Math.round(((original - finalPrice) / original) * 100)}% OFF)
                    </span>
                  )}
                </div>
                {installments > 0 && (
                  <div className="text-muted-foreground text-xs">
                    Total {isMonthly ? "em " + installments + " mensalidades" : "em " + installments + "x"}:
                    {" "}<strong className="text-foreground">{formatBRL(total)}</strong>
                    {totalOriginal > total && ` (economia de ${formatBRL(totalOriginal - total)})`}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldUI label="Validade da oferta (opcional)">
              <Input type="date" value={f.end_at} onChange={(e) => setF({ ...f, end_at: e.target.value })} />
            </FieldUI>
            <FieldUI label="Status">
              <SelectUI
                value={f.is_active ? "ACTIVE" : "PAUSED"}
                onChange={(v) => setF({ ...f, is_active: v === "ACTIVE" })}
                options={[
                  { value: "ACTIVE", label: "Ativa (visível no marketplace)" },
                  { value: "PAUSED", label: "Pausada" },
                ]}
              />
            </FieldUI>
          </div>
          <FieldUI label="Regras / observações (opcional)">
            <Textarea rows={2} value={f.rules} onChange={(e) => setF({ ...f, rules: e.target.value })} />
          </FieldUI>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => save.mutate()}
            disabled={
              save.isPending ||
              !f.title.trim() ||
              !f.original_price ||
              !f.discount_value ||
              (!isEad && !f.institution_unit_id) ||
              (isEad && !f.institution_unit_id && units.length > 0 ? false : false)
            }
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editing ? "Salvar alterações" : "Criar bolsa"}
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
        p_reservation_id: id, p_approve: approve, p_notes: notes ?? undefined,
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
