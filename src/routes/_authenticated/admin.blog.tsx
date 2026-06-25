import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, Loader2, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

type FormState = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  author: string;
  is_published: boolean;
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_url: "",
  author: "",
  is_published: false,
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

type Filter = "ALL" | "PUBLISHED" | "DRAFT";

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
      PUBLISHED: posts.filter((p) => p.is_published).length,
      DRAFT: posts.filter((p) => !p.is_published).length,
    }),
    [posts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === "PUBLISHED" && !p.is_published) return false;
      if (filter === "DRAFT" && p.is_published) return false;
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
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      cover_url: p.cover_url ?? "",
      author: p.author ?? "",
      is_published: p.is_published,
    });
    setOpen(true);
  }

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["blog-posts"] });
    qc.invalidateQueries({ queryKey: ["home-blog-posts"] });
  }

  async function handleSave(publishNow?: boolean) {
    if (!form.title.trim()) {
      toast.error("Informe o título");
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const willPublish = publishNow ?? form.is_published;
    const payload = {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      cover_url: form.cover_url.trim() || null,
      author: form.author.trim() || null,
      is_published: willPublish,
      published_at: willPublish ? new Date().toISOString() : null,
    };

    const res = form.id
      ? await supabase.from("blog_posts").update(payload).eq("id", form.id)
      : await supabase.from("blog_posts").insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(
      form.id
        ? willPublish
          ? "Notícia publicada"
          : "Rascunho salvo"
        : willPublish
          ? "Notícia publicada"
          : "Rascunho criado",
    );
    setOpen(false);
    invalidateAll();
  }

  async function togglePublish(p: Post) {
    const next = !p.is_published;
    const payload = {
      is_published: next,
      published_at: next ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Notícia publicada" : "Notícia despublicada");
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
            Publique notícias, dicas e novidades — aparecem no Guia do Estudante e na home.
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
            {posts.length === 0 ? "Nenhuma notícia cadastrada." : "Nenhuma notícia encontrada com este filtro."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <li key={p.id} className="p-4 flex flex-wrap items-center gap-4">
                <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                  {p.cover_url && (
                    <img src={p.cover_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    /{p.slug} • {p.author ?? "Equipe Tô de Bolsa"} •{" "}
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("pt-BR") : "—"}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    p.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.is_published ? "Publicado" : "Rascunho"}
                </span>
                <div className="flex items-center gap-1">
                  {p.is_published && (
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
                    title={p.is_published ? "Despublicar" : "Publicar"}
                  >
                    {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar notícia" : "Nova notícia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Como conseguir uma bolsa..."
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="como-conseguir-bolsa"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Autor</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Equipe Tô de Bolsa"
                />
              </div>
              <div>
                <Label>Imagem de capa (URL)</Label>
                <Input
                  value={form.cover_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
                  placeholder="https://... ou /blog/imagem.jpg"
                />
              </div>
            </div>
            <div>
              <Label>Resumo</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                placeholder="Pequeno resumo exibido nas listagens."
              />
            </div>
            <div>
              <Label>Conteúdo (HTML)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                placeholder="<p>Texto do artigo. Use HTML para formatação.</p>"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="is-pub"
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
                <div>
                  <Label htmlFor="is-pub" className="!mt-0">
                    Publicado
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ligado, a notícia fica visível no site.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar rascunho
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {form.id && form.is_published ? "Salvar e manter publicado" : "Publicar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
