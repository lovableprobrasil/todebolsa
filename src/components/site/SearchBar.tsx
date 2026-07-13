import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, KNOWLEDGE_AREAS, MODALITY_LABEL } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

const MODALITIES = ["PRESENCIAL", "SEMIPRESENCIAL", "EAD"] as const;

export function SearchBar({
  initialLevel,
  initialArea,
  initialModality,
  initialCity,
  initialQuery,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showLevelChips: _showLevelChips = true,
}: {
  initialLevel?: string;
  initialArea?: string;
  initialModality?: string;
  initialCity?: string;
  initialQuery?: string;
  showLevelChips?: boolean;
}) {
  const navigate = useNavigate();
  const [level, setLevel] = useState<string>(initialLevel ?? "");
  const [area, setArea] = useState<string>(initialArea ?? "");
  const [modality, setModality] = useState<string>(initialModality ?? "");
  const [city, setCity] = useState<string>(initialCity ?? "");
  const [query, setQuery] = useState<string>(initialQuery ?? "");

  const isEad = modality === "EAD";

  // Ao trocar para EAD, cidade deixa de ser exigida — limpamos o campo
  useEffect(() => {
    if (isEad && city) setCity("");
  }, [isEad, city]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/bolsas",
      search: {
        level: level || undefined,
        area: area || undefined,
        modality: modality || undefined,
        city: !isEad && city.trim() ? city.trim() : undefined,
        q: query.trim() || undefined,
      },
    });
  }

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-3 md:p-4">
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {/* Tipo de curso */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tipo de curso
          </label>
          <Select value={level || "ALL"} onValueChange={(v) => setLevel(v === "ALL" ? "" : v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Área de interesse */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Área de interesse
          </label>
          <Select value={area || "ALL"} onValueChange={(v) => setArea(v === "ALL" ? "" : v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as áreas</SelectItem>
              {KNOWLEDGE_AREAS.map((a) => (
                <SelectItem key={a.slug} value={a.slug}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modalidade */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Modalidade
          </label>
          <Select value={modality || "ALL"} onValueChange={(v) => setModality(v === "ALL" ? "" : v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {MODALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {MODALITY_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cidade */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Cidade {isEad ? "(não exigido em EAD)" : ""}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isEad ? "Curso à distância" : "Cidade"}
              disabled={isEad}
              className="h-12 pl-9"
              aria-label="Cidade"
            />
          </div>
        </div>

        {/* Palavra-chave opcional */}
        <div className="md:col-span-2 lg:col-span-3 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Palavra-chave (opcional)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: enfermagem, direito, inglês..."
              className="h-12 pl-9"
              aria-label="Palavra-chave"
            />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1 flex items-end">
          <Button type="submit" size="lg" className="h-12 w-full font-semibold">
            Buscar bolsas
          </Button>
        </div>
      </form>
    </div>
  );
}
