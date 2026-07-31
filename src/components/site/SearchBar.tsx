import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trackEvent } from "@/lib/analytics";
import { CampaignLevel } from "@/lib/homepage/campaigns";

const MODALITIES = [
  { id: "PRESENCIAL", label: "Presencial" },
  { id: "SEMIPRESENCIAL", label: "Semi" },
  { id: "EAD", label: "EaD" },
] as const;

const MAX_PRICE = 12000;

function formatPrice(v: number) {
  return v >= MAX_PRICE
    ? `R$ ${MAX_PRICE.toLocaleString("pt-BR")}/mês`
    : `R$ ${v.toLocaleString("pt-BR")}/mês`;
}

export function SearchBar({
  initialLevel,
  activeLevel,
  initialModality,
  initialCity,
  initialQuery,
}: {
  initialLevel?: string;
  activeLevel?: CampaignLevel;
  initialArea?: string;
  initialModality?: string;
  initialCity?: string;
  initialQuery?: string;
}) {
  const navigate = useNavigate();
  const [city, setCity] = useState<string>(initialCity ?? "");
  const [query, setQuery] = useState<string>(initialQuery ?? "");
  const [institution, setInstitution] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [modalities, setModalities] = useState<string[]>(
    initialModality ? [initialModality] : ["PRESENCIAL", "SEMIPRESENCIAL", "EAD"],
  );

  const onlyEad = modalities.length === 1 && modalities[0] === "EAD";

  useEffect(() => {
    if (onlyEad && city) setCity("");
  }, [onlyEad, city]);

  function toggleModality(id: string) {
    setModalities((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const modality = modalities.length === 1 ? modalities[0] : undefined;
    void trackEvent("search_submit", {
      entityType: "search",
      metadata: {
        level: activeLevel || initialLevel || null,
        modality: modality ?? null,
        city: !onlyEad && city.trim() ? city.trim() : null,
        q: query.trim() || null,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : null,
      },
    });
    navigate({
      to: "/bolsas",
      search: {
        level: activeLevel || initialLevel || undefined,
        modality,
        city: !onlyEad && city.trim() ? city.trim() : undefined,
        q: [query.trim(), institution.trim()].filter(Boolean).join(" ") || undefined,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : undefined,
      },
    });
  }

  const queryLabel =
    activeLevel === "ESCOLAS"
      ? "Qual etapa de ensino você procura?"
      : activeLevel === "IDIOMAS"
        ? "Qual idioma você quer aprender?"
        : "Qual curso você quer estudar?";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid items-end gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label={queryLabel}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtre por curso"
            className="h-12 rounded-md border-input bg-background text-[15px]"
          />
        </Field>

        <Field label="Prefere alguma instituição?">
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Filtre por instituição"
              className="h-12 rounded-md border-input bg-background pl-9 text-[15px]"
            />
          </div>
        </Field>

        <Field label="Em que cidade quer estudar?">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={onlyEad ? "Curso a distância" : "Cidade ou estado"}
              disabled={onlyEad}
              className="h-12 rounded-md border-input bg-background pl-9 text-[15px]"
            />
          </div>
        </Field>

        <Button
          type="submit"
          className="h-12 w-full rounded-md px-8 text-[15px] font-bold lg:w-auto"
        >
          <Search className="mr-1 h-4 w-4 lg:hidden" />
          Buscar
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <span className="shrink-0 text-[15px] text-brand-ink">Até quanto pode pagar?</span>
          <input
            type="range"
            min={200}
            max={MAX_PRICE}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            aria-label="Valor máximo da mensalidade"
            className="h-1.5 max-w-[280px] flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${((maxPrice - 200) / (MAX_PRICE - 200)) * 100}%, var(--color-border) ${((maxPrice - 200) / (MAX_PRICE - 200)) * 100}%)`,
            }}
          />
          <span className="shrink-0 text-[15px] font-medium text-brand-ink">
            {formatPrice(maxPrice)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <span className="text-[15px] text-brand-ink">Modalidade:</span>
          {MODALITIES.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2 text-[15px]">
              <Checkbox
                checked={modalities.includes(m.id)}
                onCheckedChange={() => toggleModality(m.id)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[15px] text-brand-ink">{label}</label>
      {children}
    </div>
  );
}
