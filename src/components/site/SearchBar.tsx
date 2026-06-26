import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SearchBar({
  initialLevel,
  initialQuery,
  initialCity,
  showLevelChips = true,
}: {
  initialLevel?: string;
  initialQuery?: string;
  initialCity?: string;
  showLevelChips?: boolean;
}) {
  const navigate = useNavigate();
  const [level, setLevel] = useState<string | undefined>(initialLevel ?? "GRADUACAO");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [city, setCity] = useState(initialCity ?? "");

  const placeholder =
    CATEGORIES.find((c) => c.slug === level)?.placeholder ?? "Curso, instituição, cidade ou área";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/bolsas",
      search: {
        level: level || undefined,
        q: query.trim() || undefined,
        city: city.trim() || undefined,
      },
    });
  }

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-3 md:p-4 space-y-3">
      {showLevelChips ? (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = level === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setLevel(active ? undefined : c.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:border-primary/40 hover:text-foreground",
                )}
                aria-pressed={active}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="grid gap-2 md:grid-cols-[1.6fr_1fr_auto] md:items-center"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-12 pl-9"
            aria-label="Buscar"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade ou EAD"
            className="h-12 pl-9"
            aria-label="Cidade"
          />
        </div>

        <Button type="submit" size="lg" className="h-12 px-6 font-semibold">
          Buscar bolsas
        </Button>
      </form>
    </div>
  );
}
