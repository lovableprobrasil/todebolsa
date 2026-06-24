import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/format";

export function SearchBar({
  initialLevel,
  initialQuery,
  initialCity,
}: {
  initialLevel?: string;
  initialQuery?: string;
  initialCity?: string;
}) {
  const navigate = useNavigate();
  const [level, setLevel] = useState<string>(initialLevel ?? "GRADUACAO");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [city, setCity] = useState(initialCity ?? "");

  const placeholder =
    CATEGORIES.find((c) => c.slug === level)?.placeholder ?? "Digite o curso desejado";

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
    <form
      onSubmit={submit}
      className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-3 md:p-4 grid gap-3 md:grid-cols-[1.1fr_1.4fr_1fr_auto] md:items-center"
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary md:bg-transparent md:py-0">
        <BookOpen className="h-4 w-4 text-muted-foreground md:hidden" />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="border-0 bg-transparent md:border md:bg-background h-12">
            <SelectValue placeholder="Tipo de curso" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-12 pl-9"
        />
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cidade"
          className="h-12 pl-9"
        />
      </div>

      <Button type="submit" size="lg" className="h-12 px-6 font-semibold">
        Buscar bolsas
      </Button>
    </form>
  );
}
