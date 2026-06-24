import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchBar } from "@/components/site/SearchBar";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { listScholarships } from "@/lib/scholarships";
import { CATEGORIES, COURSE_LEVEL_LABEL, MODALITY_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";

const searchSchema = z.object({
  level: fallback(z.string().optional(), undefined),
  q: fallback(z.string().optional(), undefined),
  city: fallback(z.string().optional(), undefined),
  modality: fallback(z.string().optional(), undefined),
  minDiscount: fallback(z.number().optional(), undefined),
});

export const Route = createFileRoute("/bolsas")({
  validateSearch: zodValidator(searchSchema),
  head: ({ match }) => {
    const s = match.search as z.infer<typeof searchSchema>;
    const levelLabel = s.level ? COURSE_LEVEL_LABEL[s.level] : null;
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
      ],
    };
  },
  component: BolsasPage,
});

function BolsasPage() {
  const search = Route.useSearch();
  const [minDiscount, setMinDiscount] = useState<number>(search.minDiscount ?? 0);
  const [modality, setModality] = useState<string | undefined>(search.modality);

  const filters = useMemo(
    () => ({
      level: search.level,
      query: search.q,
      city: search.city,
      modality,
      minDiscount: minDiscount > 0 ? minDiscount : undefined,
    }),
    [search.level, search.q, search.city, modality, minDiscount],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["scholarships", "list", filters],
    queryFn: () => listScholarships(filters),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-1">
            Encontre sua bolsa de estudo
          </h1>
          <p className="text-muted-foreground mb-6">
            Filtre por nível, cidade, modalidade e desconto.
          </p>
          <SearchBar initialLevel={search.level} initialQuery={search.q} initialCity={search.city} />
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-bold mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </div>

            <div className="mb-5">
              <Label className="mb-2 block">Nível de ensino</Label>
              <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    to="/bolsas"
                    search={(prev) => ({ ...prev, level: prev.level === c.slug ? undefined : c.slug })}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      search.level === c.slug
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <Label className="mb-2 block">Modalidade</Label>
              <div className="space-y-2">
                {["PRESENCIAL", "SEMIPRESENCIAL", "EAD"].map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={modality === m}
                      onCheckedChange={(v) => setModality(v ? m : undefined)}
                    />
                    {MODALITY_LABEL[m]}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <Label className="mb-2 block">
                Desconto mínimo: <span className="font-bold text-primary">{minDiscount}%</span>
              </Label>
              <Slider
                value={[minDiscount]}
                min={0}
                max={90}
                step={5}
                onValueChange={(v) => setMinDiscount(v[0] ?? 0)}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                setMinDiscount(0);
                setModality(undefined);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </aside>

        <section>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Carregando bolsas..."
                : `${data?.length ?? 0} ${data?.length === 1 ? "bolsa encontrada" : "bolsas encontradas"}`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.map((s) => <ScholarshipCard key={s.id} s={s} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="font-semibold mb-1">Nenhuma bolsa encontrada</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou ampliar sua busca.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
