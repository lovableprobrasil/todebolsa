import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Newspaper,
  Loader2,
  ExternalLink,
  Search,
  Sparkles,
  ImagePlus,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  aiExtractUrl,
  aiGenerateArticle,
  aiGenerateImage,
  aiRewriteText,
} from "@/lib/news.functions";
import { listPostVersions, restorePostVersion } from "@/lib/news-versions.functions";
import { History, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  image_credit: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  main_keyword: string | null;
  secondary_keywords: string[] | null;
  source_url: string | null;
  source_name: string | null;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_at: string | null;
  featured: boolean | null;
  ai_generated: boolean | null;
  ai_warnings: string[] | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

type FormState = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  cover_url: string;
  thumbnail_url: string;
  og_image_url: string;
  image_alt: string;
  image_credit: string;
  author: string;
  category: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  main_keyword: string;
  secondary_keywords: string;
  source_url: string;
  source_name: string;
  status: Post["status"];
  scheduled_at: string;
  featured: boolean;
  ai_generated: boolean;
  ai_warnings: string[];
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  cover_url: "",
  thumbnail_url: "",
  og_image_url: "",
  image_alt: "",
  image_credit: "",
  author: "",
  category: "",
  tags: "",
  meta_title: "",
  meta_description: "",
  main_keyword: "",
  secondary_keywords: "",
  source_url: "",
  source_name: "",
  status: "DRAFT",
  scheduled_at: "",
  featured: false,
  ai_generated: false,
  ai_warnings: [],
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

type Filter = "ALL" | "PUBLISHED" | "DRAFT" | "SCHEDULED" | "ARCHIVED";

const STATUS_LABEL: Record<Post["status"], string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em revisão",
  SCHEDULED: "Agendada",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};

const STATUS_COLOR: Record<Post["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-amber-500/10 text-amber-700",
  SCHEDULED: "bg-sky-500/10 text-sky-700",
  PUBLISHED: "bg-emerald-500/10 text-emerald-700",
  ARCHIVED: "bg-zinc-500/10 text-zinc-600",
};

function AdminBlogPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const counts = useMemo(
    () => ({
      ALL: posts.length,
      PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
      DRAFT: posts.filter((p) => p.status === "DRAFT").length,
      SCHEDULED: posts.filter((p) => p.status === "SCHEDULED").length,
      ARCHIVED: posts.filter((p) => p.status === "ARCHIVED").length,
    }),
    [posts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "ALL" && p.status !== filter) return false;
      if (q && !`${p.title} ${p.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, filter, search]);

  function openNew() {
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(p: Post) {
    setForm({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? "",
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      cover_url: p.cover_url ?? "",
      thumbnail_url: p.thumbnail_url ?? "",
      og_image_url: p.og_image_url ?? "",
      image_alt: p.image_alt ?? "",
      image_credit: p.image_credit ?? "",
      author: p.author ?? "",
      category: p.category ?? "",
      tags: (p.tags ?? []).join(", "),
      meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "",
      main_keyword: p.main_keyword ?? "",
      secondary_keywords: (p.secondary_keywords ?? []).join(", "),
      source_url: p.source_url ?? "",
      source_name: p.source_name ?? "",
      status: p.status,
      scheduled_at: p.scheduled_at ? p.scheduled_at.slice(0, 16) : "",
      featured: !!p.featured,
      ai_generated: !!p.ai_generated,
      ai_warnings: p.ai_warnings ?? [],
    });
    setOpen(true);
  }

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["blog-posts"] });
    qc.invalidateQueries({ queryKey: ["home-blog-posts"] });
  }

  async function handleSave(targetStatus?: Post["status"]) {
    if (!form.title.trim()) {
      toast.error("Informe o título");
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const status = targetStatus ?? form.status;
    const isPub = status === "PUBLISHED";
    const payload: any = {
      slug,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      cover_url: form.cover_url.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      og_image_url: form.og_image_url.trim() || null,
      image_alt: form.image_alt.trim() || null,
      image_credit: form.image_credit.trim() || null,
      author: form.author.trim() || null,
      category: form.category.trim() || null,
      tags: parseList(form.tags),
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      main_keyword: form.main_keyword.trim() || null,
      secondary_keywords: parseList(form.secondary_keywords),
      source_url: form.source_url.trim() || null,
      source_name: form.source_name.trim() || null,
      status,
      scheduled_at:
        status === "SCHEDULED" && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      featured: form.featured,
      ai_generated: form.ai_generated,
      ai_warnings: form.ai_warnings,
      is_published: isPub,
      published_at: isPub ? new Date().toISOString() : null,
    };

    const res = form.id
      ? await supabase.from("blog_posts").update(payload).eq("id", form.id)
      : await supabase.from("blog_posts").insert(payload).select("id").maybeSingle();

    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(
      isPub ? "Notícia publicada" : status === "SCHEDULED" ? "Publicação agendada" : "Notícia salva",
    );
    setOpen(false);
    invalidateAll();
  }

  async function togglePublish(p: Post) {
    const next = p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const isPub = next === "PUBLISHED";
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status: next,
        is_published: isPub,
        published_at: isPub ? new Date().toISOString() : null,
      })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(isPub ? "Notícia publicada" : "Notícia despublicada");
    invalidateAll();
  }

  async function handleDelete(p: Post) {
    if (!confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Notícia excluída");
    invalidateAll();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> Notícias
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie notícias manualmente ou com IA — geração de texto, SEO e imagens.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova notícia
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="ALL">Todas ({counts.ALL})</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Publicadas ({counts.PUBLISHED})</TabsTrigger>
            <TabsTrigger value="DRAFT">Rascunhos ({counts.DRAFT})</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Agendadas ({counts.SCHEDULED})</TabsTrigger>
            <TabsTrigger value="ARCHIVED">Arquivadas ({counts.ARCHIVED})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou slug"
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Carregando…</div>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-destructive">Não foi possível carregar as notícias.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Verifique sua permissão e tente novamente."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            {posts.length === 0 ? "Nenhuma notícia cadastrada." : "Nenhuma notícia neste filtro."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <li key={p.id} className="p-4 flex flex-wrap items-center gap-4">
                <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                  {(p.thumbnail_url || p.cover_url) && (
                    <img
                      src={p.thumbnail_url || p.cover_url || ""}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {p.title}
                    {p.ai_generated && (
                      <span className="text-[10px] inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-700 px-2 py-0.5">
                        <Sparkles className="h-3 w-3" /> IA
                      </span>
                    )}
                    {p.featured && (
                      <span className="text-[10px] rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5">
                        destaque
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    /{p.slug} • {p.category ?? "Sem categoria"} • {p.author ?? "Equipe Tô de Bolsa"}{" "}
                    •{" "}
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString("pt-BR")
                      : p.scheduled_at
                        ? `agendada p/ ${new Date(p.scheduled_at).toLocaleString("pt-BR")}`
                        : "—"}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
                <div className="flex items-center gap-1">
                  {p.status === "PUBLISHED" && (
                    <a
                      href={`/guia/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Ver no site"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublish(p)}
                    title={p.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                  >
                    {p.status === "PUBLISHED" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar notícia" : "Nova notícia"}</DialogTitle>
          </DialogHeader>

          <NewsEditor form={form} setForm={setForm} />

          <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleSave("DRAFT")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar rascunho
            </Button>
            {form.status === "SCHEDULED" || form.scheduled_at ? (
              <Button onClick={() => handleSave("SCHEDULED")} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Agendar publicação
              </Button>
            ) : null}
            <Button onClick={() => handleSave("PUBLISHED")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publicar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============= EDITOR =============
function NewsEditor({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const [tab, setTab] = useState("content");
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className={`grid w-full ${form.id ? "grid-cols-6" : "grid-cols-5"}`}>
        <TabsTrigger value="content">Conteúdo</TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          IA
        </TabsTrigger>
        <TabsTrigger value="images">
          <ImagePlus className="h-3.5 w-3.5 mr-1" />
          Imagens
        </TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="publish">Publicação</TabsTrigger>
        {form.id && (
          <TabsTrigger value="versions">
            <History className="h-3.5 w-3.5 mr-1" />
            Versões
          </TabsTrigger>
        )}
      </TabsList>

      {/* Aviso IA */}
      {form.ai_generated && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm px-3 py-2 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            Conteúdo gerado por IA. Revise informações factuais antes de publicar.
            {form.ai_warnings.length > 0 && (
              <ul className="list-disc pl-4 mt-1">
                {form.ai_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <TabsContent value="content" className="space-y-4 mt-4">
        <div>
          <Label>Título *</Label>
          <Input
            value={form.title}
            onChange={(e) =>
              set({
                title: e.target.value,
                slug: form.id ? form.slug : slugify(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <Input
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              placeholder="Ex.: Bolsas, Carreira, Mercado"
            />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={form.tags}
              onChange={(e) => set({ tags: e.target.value })}
              placeholder="enem, vestibular, prouni"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Autor</Label>
            <Input value={form.author} onChange={(e) => set({ author: e.target.value })} />
          </div>
          <div>
            <Label>Fonte (nome)</Label>
            <Input
              value={form.source_name}
              onChange={(e) => set({ source_name: e.target.value })}
              placeholder="Folha, G1, MEC..."
            />
          </div>
        </div>
        <div>
          <Label>URL da fonte</Label>
          <Input
            value={form.source_url}
            onChange={(e) => set({ source_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Resumo</Label>
          <Textarea
            value={form.excerpt}
            onChange={(e) => set({ excerpt: e.target.value })}
            rows={2}
          />
        </div>
        <div>
          <Label>Conteúdo (HTML)</Label>
          <Textarea
            value={form.content}
            onChange={(e) => set({ content: e.target.value })}
            rows={14}
            className="font-mono text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <RewriteBtn label="Melhorar texto" mode="improve" form={form} set={set} />
            <RewriteBtn label="Reescrever" mode="rewrite" form={form} set={set} />
            <RewriteBtn label="Encurtar" mode="shorten" form={form} set={set} />
            <RewriteBtn label="Expandir" mode="expand" form={form} set={set} />
            <RewriteBtn label="Otimizar SEO" mode="seo" form={form} set={set} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ai" className="mt-4">
        <AIPanel form={form} set={set} />
      </TabsContent>

      <TabsContent value="images" className="mt-4">
        <ImagesPanel form={form} set={set} />
      </TabsContent>

      <TabsContent value="seo" className="space-y-4 mt-4">
        <div>
          <Label>Meta title (até 60 chars)</Label>
          <Input
            value={form.meta_title}
            onChange={(e) => set({ meta_title: e.target.value })}
            maxLength={70}
          />
          <div className="text-xs text-muted-foreground mt-1">{form.meta_title.length}/60</div>
        </div>
        <div>
          <Label>Meta description (até 160 chars)</Label>
          <Textarea
            value={form.meta_description}
            onChange={(e) => set({ meta_description: e.target.value })}
            rows={3}
            maxLength={180}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {form.meta_description.length}/160
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Palavra-chave principal</Label>
            <Input
              value={form.main_keyword}
              onChange={(e) => set({ main_keyword: e.target.value })}
            />
          </div>
          <div>
            <Label>Palavras-chave secundárias (vírgula)</Label>
            <Input
              value={form.secondary_keywords}
              onChange={(e) => set({ secondary_keywords: e.target.value })}
            />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-2">
            Pré-visualização Google
          </div>
          <div className="text-[#1a0dab] text-base leading-tight truncate">
            {form.meta_title || form.title || "Título da notícia"}
          </div>
          <div className="text-[#006621] text-xs">
            todebolsa.com.br › guia › {form.slug || "slug"}
          </div>
          <div className="text-[#545454] text-sm">
            {form.meta_description || form.excerpt || "Descrição que aparecerá nos resultados."}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="publish" className="space-y-4 mt-4">
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set({ status: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="IN_REVIEW">Em revisão</SelectItem>
              <SelectItem value="SCHEDULED">Agendada</SelectItem>
              <SelectItem value="PUBLISHED">Publicada</SelectItem>
              <SelectItem value="ARCHIVED">Arquivada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Agendar para</Label>
          <Input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => set({ scheduled_at: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <Label className="!mt-0">Destaque na home</Label>
            <p className="text-xs text-muted-foreground">Aparece em posição privilegiada.</p>
          </div>
          <Switch checked={form.featured} onCheckedChange={(v) => set({ featured: v })} />
        </div>
        <Checklist form={form} />
      </TabsContent>
    </Tabs>
  );
}

function RewriteBtn({
  label,
  mode,
  form,
  set,
}: {
  label: string;
  mode: "improve" | "rewrite" | "shorten" | "expand" | "seo";
  form: FormState;
  set: (p: Partial<FormState>) => void;
}) {
  const m = useMutation({
    mutationFn: () => aiRewriteText({ data: { text: form.content, mode } }),
    onSuccess: (r) => {
      if (r.html) {
        set({ content: r.html, ai_generated: true });
        toast.success("Texto atualizado pela IA");
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Falha na IA"),
  });
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={m.isPending || !form.content.trim()}
      onClick={() => m.mutate()}
    >
      {m.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
      {label}
    </Button>
  );
}

function AIPanel({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  const [briefing, setBriefing] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [length, setLength] = useState<"curta" | "media" | "completa" | "aprofundada">("media");
  const [tone, setTone] = useState("profissional");
  const [audience, setAudience] = useState("estudantes brasileiros");
  const [objective, setObjective] = useState("informar e atrair tráfego orgânico");

  const extract = useMutation({
    mutationFn: (url: string) => aiExtractUrl({ data: { url } }),
    onSuccess: (r) => {
      if (r.ok) {
        setReferenceText((prev) =>
          prev
            ? prev
            : `${r.title ?? ""}\n${r.description ?? ""}\n\n${r.text ?? ""}`.trim(),
        );
        toast.success("Conteúdo da URL importado como referência.");
      } else {
        toast.warning(r.message);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao ler URL"),
  });

  const generate = useMutation({
    mutationFn: () =>
      aiGenerateArticle({
        data: {
          topic: form.title || briefing.slice(0, 80) || "Bolsas de estudo",
          briefing,
          referenceText: referenceText || undefined,
          referenceUrl: referenceUrl || undefined,
          audience,
          tone,
          category: form.category || undefined,
          mainKeyword: form.main_keyword || undefined,
          secondaryKeywords: parseList(form.secondary_keywords),
          length,
          objective,
        },
      }),
    onSuccess: (r: any) => {
      set({
        title: r.title || form.title,
        subtitle: r.subtitle || form.subtitle,
        excerpt: r.excerpt || form.excerpt,
        slug: form.id ? form.slug : r.slug || slugify(r.title || form.title),
        content: r.content_html || form.content,
        category: r.category || form.category,
        tags: Array.isArray(r.tags) ? r.tags.join(", ") : form.tags,
        meta_title: r.meta_title || form.meta_title,
        meta_description: r.meta_description || form.meta_description,
        main_keyword: r.main_keyword || form.main_keyword,
        secondary_keywords: Array.isArray(r.secondary_keywords)
          ? r.secondary_keywords.join(", ")
          : form.secondary_keywords,
        image_alt: r.image_alt || form.image_alt,
        source_url: referenceUrl || form.source_url,
        ai_generated: true,
        ai_warnings: Array.isArray(r.warnings) ? r.warnings : [],
      });
      if (r.image_prompt) {
        // Save into localStorage so ImagesPanel can pick it up
        try {
          localStorage.setItem("__news_image_prompt", r.image_prompt);
        } catch {}
      }
      toast.success("Rascunho gerado com IA. Revise antes de publicar.");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao gerar"),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-violet-900">
          <Sparkles className="h-4 w-4" /> Gerar notícia com IA
        </div>
        <p className="text-xs text-violet-800/80">
          Use briefing, URL ou texto-base. A IA gera rascunho, SEO e prompt de imagem. Você revisa antes de publicar.
        </p>

        <div>
          <Label>Briefing / tema</Label>
          <Textarea
            rows={3}
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="Ex.: Quero uma matéria sobre como o ENEM ajuda a conseguir bolsas em faculdades particulares."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>URL de referência (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button
                type="button"
                variant="outline"
                disabled={!referenceUrl || extract.isPending}
                onClick={() => extract.mutate(referenceUrl)}
              >
                {extract.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label>Tamanho</Label>
            <Select value={length} onValueChange={(v) => setLength(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curta">Curta (350-500)</SelectItem>
                <SelectItem value="media">Média (600-900)</SelectItem>
                <SelectItem value="completa">Completa (1000-1400)</SelectItem>
                <SelectItem value="aprofundada">Aprofundada (1500-2200)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Texto-base / referência (opcional)</Label>
          <Textarea
            rows={4}
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder="Cole trechos de referência. A IA usará como inspiração, não copiará."
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Tom</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div>
            <Label>Público</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div>
            <Label>Objetivo</Label>
            <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Gerar notícia com IA
        </Button>
      </div>
    </div>
  );
}

function ImagesPanel({
  form,
  set,
}: {
  form: FormState;
  set: (p: Partial<FormState>) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Foto editorial realista");
  const [aspect, setAspect] = useState<"16:9" | "1:1" | "9:16" | "1200x630">("16:9");
  const [imageType, setImageType] = useState<"cover" | "thumbnail" | "og" | "internal" | "social">(
    "cover",
  );
  const [generated, setGenerated] = useState<
    Array<{ id?: string; url: string; imageType: string; aspect: string }>
  >([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("__news_image_prompt");
      if (saved && !prompt) setPrompt(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = useMutation({
    mutationFn: () =>
      aiGenerateImage({
        data: {
          prompt,
          style,
          aspect,
          imageType,
          articleId: form.id as any,
        },
      }),
    onSuccess: (r) => {
      setGenerated((g) => [r, ...g]);
      toast.success("Imagem gerada");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao gerar imagem"),
  });

  function applyAs(target: "cover" | "thumbnail" | "og", url: string) {
    if (target === "cover") set({ cover_url: url });
    if (target === "thumbnail") set({ thumbnail_url: url });
    if (target === "og") set({ og_image_url: url });
    toast.success("Imagem aplicada");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sky-900">
          <ImagePlus className="h-4 w-4" /> Gerar imagem com IA
        </div>
        <div>
          <Label>Descrição da imagem (prompt)</Label>
          <Textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex.: Estudantes brasileiros em ambiente educacional, livros, notebook, atmosfera positiva."
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Estilo</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Foto editorial realista",
                  "Ilustração moderna",
                  "3D educacional",
                  "Flat design",
                  "Colagem editorial",
                  "Imagem institucional",
                  "Estilo capa de portal de notícias",
                  "Estilo redes sociais",
                  "Estilo jovem e universitário",
                  "Estilo corporativo",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Formato</Label>
            <Select value={aspect} onValueChange={(v) => setAspect(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Capa 16:9</SelectItem>
                <SelectItem value="1:1">Quadrada 1:1</SelectItem>
                <SelectItem value="9:16">Vertical 9:16</SelectItem>
                <SelectItem value="1200x630">Open Graph 1200×630</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Uso pretendido</Label>
            <Select value={imageType} onValueChange={(v) => setImageType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Capa</SelectItem>
                <SelectItem value="thumbnail">Thumbnail</SelectItem>
                <SelectItem value="og">Open Graph</SelectItem>
                <SelectItem value="internal">Imagem interna</SelectItem>
                <SelectItem value="social">Redes sociais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          disabled={!prompt.trim() || m.isPending}
          onClick={() => m.mutate()}
          className="w-full"
        >
          {m.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Gerar imagem
        </Button>
      </div>

      {generated.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {generated.map((g, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-border bg-card">
              <img src={g.url} alt="" className="w-full aspect-video object-cover" />
              <div className="p-2 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => applyAs("cover", g.url)}>
                  Capa
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyAs("thumbnail", g.url)}>
                  Thumb
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyAs("og", g.url)}>
                  OG
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        {(["cover_url", "thumbnail_url", "og_image_url"] as const).map((key) => {
          const label = key === "cover_url" ? "Capa" : key === "thumbnail_url" ? "Thumbnail" : "Open Graph";
          const val = form[key];
          return (
            <div key={key} className="rounded-lg border border-border p-3 bg-muted/20">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{label}</div>
              <div className="aspect-video bg-muted rounded overflow-hidden mb-2">
                {val ? (
                  <img src={val} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </div>
              <Input
                value={val}
                onChange={(e) => set({ [key]: e.target.value } as any)}
                placeholder="URL"
              />
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Alt text da imagem</Label>
          <Input value={form.image_alt} onChange={(e) => set({ image_alt: e.target.value })} />
        </div>
        <div>
          <Label>Crédito</Label>
          <Input
            value={form.image_credit}
            onChange={(e) => set({ image_credit: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function Checklist({ form }: { form: FormState }) {
  const items: Array<[boolean, string]> = [
    [!!form.title.trim(), "Título preenchido"],
    [!!form.slug.trim(), "Slug definido"],
    [!!form.content.trim(), "Conteúdo preenchido"],
    [!!form.category.trim(), "Categoria definida"],
    [!!form.cover_url.trim(), "Imagem de capa"],
    [!!form.meta_description.trim(), "Meta description preenchida"],
    [!!form.image_alt.trim(), "Alt text da imagem"],
  ];
  const okCount = items.filter(([ok]) => ok).length;
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="font-semibold text-sm mb-2">
        Checklist editorial ({okCount}/{items.length})
      </div>
      <ul className="space-y-1">
        {items.map(([ok, label]) => (
          <li key={label} className="text-sm flex items-center gap-2">
            {ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
