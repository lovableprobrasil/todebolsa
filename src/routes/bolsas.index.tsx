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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  minPrice?: number;
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
    minPrice: num(raw.minPrice),
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
      minPrice: search.minPrice && search.minPrice > 0 ? search.minPrice : undefined,
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
  if (search.minPrice)
    activeChips.push({
      key: "minPrice",
      label: `A partir de R$ ${search.minPrice}`,
      onRemove: () => update({ minPrice: undefined }),
    });
  if (search.maxPrice)
    activeChips.push({
      key: "maxPrice",
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
    <div className="space-y-4">
      {/* Nível de ensino */}
      <section>
        <h3 className="text-sm font-bold mb-2">Nível de ensino</h3>
        <Select
          value={search.level ?? "ALL"}
          onValueChange={(v) => update({ level: v === "ALL" ? undefined : (v as typeof search.level) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Todos os níveis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os níveis</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Modalidade */}
      <section>
        <h3 className="text-sm font-bold mb-2">Modalidade</h3>
        <Select
          value={search.modality ?? "ALL"}
          onValueChange={(v) => update({ modality: v === "ALL" ? undefined : (v as typeof search.modality) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Todas as modalidades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as modalidades</SelectItem>
            {(["PRESENCIAL", "SEMIPRESENCIAL", "EAD"] as const).map((m) => (
              <SelectItem key={m} value={m}>{MODALITY_LABEL[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Avaliação dos alunos */}
      <section>
        <h3 className="text-sm font-bold mb-2">Avaliação dos alunos</h3>
        <Select
          value={search.minRating != null ? String(search.minRating) : "ALL"}
          onValueChange={(v) => update({ minRating: v === "ALL" ? undefined : Number(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Qualquer avaliação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Qualquer avaliação</SelectItem>
            {RATING_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Mensalidade */}
      <section>
        <h3 className="text-sm font-bold mb-2">Mensalidade</h3>
        <Select
          value={search.maxPrice != null ? String(search.maxPrice) : "ALL"}
          onValueChange={(v) => update({ maxPrice: v === "ALL" ? undefined : Number(v) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Qualquer valor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Qualquer valor</SelectItem>
            {PRICE_QUICK.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Desconto */}
      <section>
        <h3 className="text-sm font-bold mb-2">Desconto</h3>
        <Select
          value={search.minDiscount != null ? String(search.minDiscount) : "ALL"}
          onValueChange={(v) => update({ minDiscount: v === "ALL" ? undefined : Number(v) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Qualquer desconto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Qualquer desconto</SelectItem>
            {DISCOUNT_QUICK.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <div className="rounded-2xl border border-border bg-card sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3 font-bold border-b border-border">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              {FiltersPanel}
            </div>
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
