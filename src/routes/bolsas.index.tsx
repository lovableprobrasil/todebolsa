import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchBar } from "@/components/site/SearchBar";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { listScholarships, listInstitutionsLite } from "@/lib/scholarships";
import { CATEGORIES, COURSE_LEVEL_LABEL, MODALITY_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X, Star, ArrowUpDown, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SortMode =
  | "relevance"
  | "best-rated"
  | "most-rated"
  | "discount-desc"
  | "price-asc"
  | "price-desc"
  | "recent";

type BolsasSearch = {
  level?: string;
  q?: string;
  city?: string;
  modality?: string;
  institutionId?: string;
  minDiscount?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SortMode;
};

const SORT_LABEL: Record<SortMode, string> = {
  relevance: "Relevância",
  "best-rated": "Melhor avaliados",
  "most-rated": "Mais avaliados",
  "discount-desc": "Maior desconto",
  "price-asc": "Menor mensalidade",
  "price-desc": "Maior mensalidade",
  recent: "Mais recentes",
};

const PRICE_QUICK = [
  { label: "Até R$ 50", value: 50 },
  { label: "Até R$ 100", value: 100 },
  { label: "Até R$ 200", value: 200 },
  { label: "Até R$ 500", value: 500 },
];

const DISCOUNT_QUICK = [
  { label: "50%+ off", value: 50 },
  { label: "70%+ off", value: 70 },
  { label: "90%+ off", value: 90 },
];

const RATING_OPTIONS = [
  { label: "5 estrelas", value: 5 },
  { label: "4★ ou mais", value: 4 },
  { label: "3★ ou mais", value: 3 },
];

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : undefined;
}

export const Route = createFileRoute("/bolsas/")({
  validateSearch: (raw: Record<string, unknown>): BolsasSearch => ({
    level: str(raw.level),
    q: str(raw.q),
    city: str(raw.city),
    modality: str(raw.modality),
    institutionId: str(raw.institutionId),
    minDiscount: num(raw.minDiscount),
    maxPrice: num(raw.maxPrice),
    minRating: num(raw.minRating),
    sort: (
      [
        "relevance",
        "best-rated",
        "most-rated",
        "discount-desc",
        "price-asc",
        "price-desc",
        "recent",
      ] as const
    ).find((s) => s === raw.sort),
  }),
  head: ({ match }) => {
    const s = (match.search ?? {}) as BolsasSearch;
    const levelLabel = s.level && s.level in COURSE_LEVEL_LABEL ? COURSE_LEVEL_LABEL[s.level] : null;
    const title = levelLabel
      ? `Bolsas em ${levelLabel}${s.city ? ` em ${s.city}` : ""} | Tô de Bolsa`
      : "Buscar bolsas de estudo | Tô de Bolsa";
    const desc = `Compare bolsas de estudo${levelLabel ? ` em ${levelLabel}` : ""}${s.city ? ` em ${s.city}` : ""} com até 90% de desconto.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: "https://todebolsa.lovable.app/bolsas" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: "https://todebolsa.lovable.app/bolsas" }],
    };
  },
  component: BolsasPage,
});

function BolsasPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const sort: SortMode = search.sort ?? "relevance";

  const update = (patch: Partial<BolsasSearch>) =>
    navigate({ search: (prev: BolsasSearch) => ({ ...prev, ...patch }) });


  const { data: institutionOpts = [] } = useQuery({
    queryKey: ["institutions", "lite"],
    queryFn: listInstitutionsLite,
    staleTime: 60_000,
  });

  const filters = useMemo(
    () => ({
      level: search.level,
      query: search.q,
      city: search.city,
      modality: search.modality,
      institutionId: search.institutionId,
      minDiscount: search.minDiscount && search.minDiscount > 0 ? search.minDiscount : undefined,
      maxPrice: search.maxPrice && search.maxPrice > 0 ? search.maxPrice : undefined,
      minRating: search.minRating && search.minRating > 0 ? search.minRating : undefined,
      sort,
    }),
    [search, sort],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "list", filters],
    queryFn: () => listScholarships(filters),
  });

  // Chips de filtros aplicados
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (search.level)
    activeChips.push({
      key: "level",
      label: COURSE_LEVEL_LABEL[search.level] ?? search.level,
      onRemove: () => update({ level: undefined }),
    });
  if (search.modality)
    activeChips.push({
      key: "modality",
      label: MODALITY_LABEL[search.modality] ?? search.modality,
      onRemove: () => update({ modality: undefined }),
    });
  if (search.city)
    activeChips.push({
      key: "city",
      label: `Cidade: ${search.city}`,
      onRemove: () => update({ city: undefined }),
    });
  if (search.institutionId) {
    const inst = institutionOpts.find((i) => i.id === search.institutionId);
    activeChips.push({
      key: "inst",
      label: inst?.trade_name ?? "Instituição",
      onRemove: () => update({ institutionId: undefined }),
    });
  }
  if (search.minDiscount)
    activeChips.push({
      key: "disc",
      label: `${search.minDiscount}%+ desconto`,
      onRemove: () => update({ minDiscount: undefined }),
    });
  if (search.maxPrice)
    activeChips.push({
      key: "price",
      label: `Até R$ ${search.maxPrice}`,
      onRemove: () => update({ maxPrice: undefined }),
    });
  if (search.minRating)
    activeChips.push({
      key: "rating",
      label: `${search.minRating}★ ou mais`,
      onRemove: () => update({ minRating: undefined }),
    });
  if (search.q)
    activeChips.push({
      key: "q",
      label: `"${search.q}"`,
      onRemove: () => update({ q: undefined }),
    });

  const clearAll = () =>
    navigate({
      search: {},
    });

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Nível de ensino — sempre visível, sem dropdown, sem rolagem interna */}
      <section>
        <h3 className="text-sm font-bold mb-2">Nível de ensino</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = search.level === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => update({ level: active ? undefined : c.slug })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40",
                )}
                aria-pressed={active}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Modalidade */}
      <section>
        <h3 className="text-sm font-bold mb-2">Modalidade</h3>
        <div className="flex flex-wrap gap-1.5">
          {(["PRESENCIAL", "SEMIPRESENCIAL", "EAD"] as const).map((m) => {
            const active = search.modality === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => update({ modality: active ? undefined : m })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40",
                )}
              >
                {MODALITY_LABEL[m]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Avaliação dos alunos */}
      <section>
        <h3 className="text-sm font-bold mb-2">Avaliação dos alunos</h3>
        <div className="flex flex-wrap gap-1.5">
          {RATING_OPTIONS.map((r) => {
            const active = search.minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => update({ minRating: active ? undefined : r.value })}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40",
                )}
              >
                <Star className={cn("h-3 w-3", active ? "fill-current" : "fill-amber-400 text-amber-400")} />
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Mensalidade rápida */}
      <section>
        <h3 className="text-sm font-bold mb-2">Mensalidade</h3>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_QUICK.map((p) => {
            const active = search.maxPrice === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => update({ maxPrice: active ? undefined : p.value })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Desconto rápido */}
      <section>
        <h3 className="text-sm font-bold mb-2">Desconto</h3>
        <div className="flex flex-wrap gap-1.5">
          {DISCOUNT_QUICK.map((d) => {
            const active = search.minDiscount === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => update({ minDiscount: active ? undefined : d.value })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Instituição com autocomplete */}
      <section>
        <h3 className="text-sm font-bold mb-2">Instituição</h3>
        <InstitutionAutocomplete
          options={institutionOpts}
          value={search.institutionId}
          onChange={(id) => update({ institutionId: id })}
        />
      </section>

      <Button variant="ghost" size="sm" className="w-full" onClick={clearAll}>
        Limpar todos os filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-1">
            Encontre sua bolsa de estudo
          </h1>
          <p className="text-muted-foreground mb-6">
            Compare cursos com bolsa e escolha pela melhor avaliação, menor preço ou maior desconto.
          </p>
          <SearchBar
            initialLevel={search.level}
            initialQuery={search.q}
            initialCity={search.city}
            showLevelChips={false}
          />
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4 font-bold">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </div>
            {FiltersPanel}
          </div>
        </aside>

        <section>
          {/* Header com contagem + ordenação + filtros móveis */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Carregando bolsas..."
                : `${data?.length ?? 0} ${data?.length === 1 ? "bolsa encontrada" : "bolsas encontradas"}`}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" /> Filtros
                    {activeChips.length > 0 ? (
                      <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                        {activeChips.length}
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] sm:w-[420px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">{FiltersPanel}</div>
                </SheetContent>
              </Sheet>
              <div className="relative">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value as SortMode })}
                  className="h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm"
                  aria-label="Ordenar resultados"
                >
                  {(Object.keys(SORT_LABEL) as SortMode[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chips de filtros aplicados */}
          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
              >
                Limpar tudo
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.map((s) => (
                <ScholarshipCard key={s.id} s={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="font-semibold mb-1">Nenhuma bolsa encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tente remover alguns filtros ou ampliar sua busca.
              </p>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Limpar filtros
              </Button>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {CATEGORIES.slice(0, 6).map((c) => (
                  <Link
                    key={c.slug}
                    to="/bolsas"
                    search={{ level: c.slug }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-primary/10"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InstitutionAutocomplete({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; trade_name: string }>;
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  const [q, setQ] = useState("");
  const selected = options.find((i) => i.id === value);
  const filtered = useMemo(() => {
    if (!q.trim()) return options.slice(0, 6);
    const t = q.toLowerCase();
    return options.filter((o) => o.trade_name.toLowerCase().includes(t)).slice(0, 8);
  }, [q, options]);

  if (selected) {
    return (
      <button
        type="button"
        onClick={() => {
          onChange(undefined);
          setQ("");
        }}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
      >
        {selected.trade_name}
        <X className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar instituição"
          className="h-9 pl-8 text-sm"
        />
      </div>
      {filtered.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onChange(i.id)}
              className="px-3 py-1 rounded-full text-xs border border-border bg-background hover:border-primary/40 hover:bg-primary/5"
            >
              {i.trade_name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma instituição encontrada.</p>
      )}
    </div>
  );
}
