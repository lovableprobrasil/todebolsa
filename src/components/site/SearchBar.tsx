import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search, Calendar, Clock, BookOpen, GraduationCap, Briefcase, Award, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODALITY_LABEL } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { CampaignLevel } from "@/lib/homepage/campaigns";

const MODALITIES = ["PRESENCIAL", "SEMIPRESENCIAL", "EAD"] as const;

export function SearchBar({
  initialLevel,
  activeLevel,
  initialArea,
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
  const [area, setArea] = useState<string>(initialArea ?? "");
  const [modality, setModality] = useState<string>(initialModality ?? "");
  const [city, setCity] = useState<string>(initialCity ?? "");
  const [query, setQuery] = useState<string>(initialQuery ?? "");

  const isEad = modality === "EAD";

  useEffect(() => {
    if (isEad && city) setCity("");
  }, [isEad, city]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void trackEvent("search_submit", {
      entityType: "search",
      metadata: {
        level: activeLevel || initialLevel || null,
        area: area || null,
        modality: modality || null,
        city: !isEad && city.trim() ? city.trim() : null,
        q: query.trim() || null,
      },
    });
    navigate({
      to: "/bolsas",
      search: {
        level: activeLevel || initialLevel || undefined,
        area: area || undefined,
        modality: modality || undefined,
        city: !isEad && city.trim() ? city.trim() : undefined,
        q: query.trim() || undefined,
      },
    });
  }

  // Dynamic content based on level
  const getFieldConfig = () => {
    switch (activeLevel) {
      case "POS_GRADUACAO":
        return {
          queryLabel: "Qual curso você quer estudar?",
          queryPlaceholder: "Ex: MBA em Gestão, Especialização...",
          areaLabel: "Área de especialização",
          showArea: true
        };
      case "TECNICO":
        return {
          queryLabel: "Qual curso técnico você procura?",
          queryPlaceholder: "Ex: Técnico em Enfermagem, Informática...",
          areaLabel: "Eixo tecnológico",
          showArea: true
        };
      case "ESCOLAS":
        return {
          queryLabel: "Qual etapa de ensino você procura?",
          queryPlaceholder: "Ex: Ensino Médio, Fundamental II...",
          areaLabel: "Tipo de escola",
          showArea: false,
          cityLabel: "Cidade ou bairro"
        };
      case "PROFISSIONALIZANTE":
        return {
          queryLabel: "Qual profissão você quer aprender?",
          queryPlaceholder: "Ex: Cabeleireiro, Confeiteiro...",
          areaLabel: "Área profissional",
          showArea: true
        };
      case "EJA":
        return {
          queryLabel: "Qual etapa deseja concluir?",
          queryPlaceholder: "Ex: Ensino Médio EJA, Fundamental...",
          areaLabel: "Turno preferido",
          showArea: false
        };
      case "IDIOMAS":
        return {
          queryLabel: "Qual idioma você quer aprender?",
          queryPlaceholder: "Ex: Inglês, Espanhol, Francês...",
          areaLabel: "Nível de conhecimento",
          showArea: false
        };
      case "CURSO_LIVRE":
        return {
          queryLabel: "O que você quer aprender?",
          queryPlaceholder: "Ex: Excel, Fotografia, Marketing...",
          areaLabel: "Área de interesse",
          showArea: true
        };
      case "OUTROS":
        return {
          queryLabel: "Qual curso você procura?",
          queryPlaceholder: "Ex: Pré-vestibular, Concurso...",
          areaLabel: "Tipo de formação",
          showArea: true
        };
      default:
        return {
          queryLabel: "Qual curso você quer estudar?",
          queryPlaceholder: "Digite o nome do curso",
          areaLabel: "Área de interesse",
          showArea: true
        };
    }
  };

  const config = getFieldConfig();

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Campo 1: Curso/Etapa */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            {config.queryLabel}
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink/30" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.queryPlaceholder}
              className="h-14 pl-11 rounded-xl border-brand-ink/10 focus:border-brand-highlight focus:ring-brand-highlight/20 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Campo 2: Instituição (Opcional mas no prompt está como Campo 2) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            Prefere alguma instituição?
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink/30" />
            <Input
              placeholder="Digite o nome da instituição"
              className="h-14 pl-11 rounded-xl border-brand-ink/10 focus:border-brand-highlight focus:ring-brand-highlight/20 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Campo 3: Cidade */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            {config.cityLabel || "Onde você quer estudar?"}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink/30" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isEad ? "Curso à distância" : "Cidade ou estado"}
              disabled={isEad}
              className="h-14 pl-11 rounded-xl border-brand-ink/10 focus:border-brand-highlight focus:ring-brand-highlight/20 bg-gray-50/50"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 items-end">
        {/* Preço máximo */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            Até quanto pode pagar?
          </label>
          <Select>
            <SelectTrigger className="h-14 rounded-xl border-brand-ink/10 bg-gray-50/50">
              <SelectValue placeholder="Qualquer valor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">Até R$ 500 /mês</SelectItem>
              <SelectItem value="1000">Até R$ 1.000 /mês</SelectItem>
              <SelectItem value="1500">Até R$ 1.500 /mês</SelectItem>
              <SelectItem value="2000">Até R$ 2.000 /mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidade */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            Modalidade
          </label>
          <Select value={modality || "ALL"} onValueChange={(v) => setModality(v === "ALL" ? "" : v)}>
            <SelectTrigger className="h-14 rounded-xl border-brand-ink/10 bg-gray-50/50">
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

        {/* Filtros Extras (apenas ilustrativo por agora) */}
        <div className="space-y-2 lg:col-span-1">
          <label className="text-sm font-bold text-brand-ink/70 ml-1">
            {config.areaLabel}
          </label>
          <Select>
            <SelectTrigger className="h-14 rounded-xl border-brand-ink/10 bg-gray-50/50">
              <SelectValue placeholder="Todas as opções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as opções</SelectItem>
              <SelectItem value="FEAT">Mais procurados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-1">
          <Button type="submit" size="lg" className="h-14 w-full rounded-xl bg-brand-highlight text-brand-ink hover:bg-brand-highlight/90 font-bold shadow-lg shadow-brand-highlight/20 transition-all hover:scale-[1.02]">
            Buscar bolsas
          </Button>
        </div>
      </div>
    </form>
  );
}
