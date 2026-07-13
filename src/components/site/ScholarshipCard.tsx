import { Link } from "@tanstack/react-router";
import { MapPin, Clock, GraduationCap, Users, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiscountBadge } from "./DiscountBadge";
import { UgeBadge } from "./UgeBadge";
import {
  COURSE_LEVEL_LABEL,
  MODALITY_LABEL,
  SHIFT_LABEL,
  discountPercent,
  formatBRL,
} from "@/lib/format";
import type { ScholarshipListItem } from "@/lib/scholarships";
import { trackEvent } from "@/lib/analytics";

export function ScholarshipCard({ s }: { s: ScholarshipListItem }) {
  const course = s.course_offering.course;
  const unit = s.course_offering.institution_unit;
  const inst = course.institution;
  const original = Number(course.original_price);
  const final = Number(s.price_with_scholarship);
  const discount = discountPercent(original, final);
  const savingMonth = original - final;
  const ratingAvg = Number(inst.rating_avg ?? 0);
  const ratingCount = Number(inst.rating_count ?? 0);
  const hasRating = ratingAvg > 0 && ratingCount > 0;

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/40 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-blue-soft text-brand-blue shrink-0">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <span className="truncate font-medium">{inst.trade_name}</span>
            </div>
            <h3 className="font-display font-bold text-lg leading-tight line-clamp-2">
              {course.name}
            </h3>
            <div className="mt-1.5 text-xs">
              {hasRating ? (
                <span className="inline-flex items-center gap-1 text-foreground/80">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <strong className="font-semibold">{ratingAvg.toFixed(1)}</strong>
                  <span className="text-muted-foreground">
                    ({ratingCount} {ratingCount === 1 ? "avaliação" : "avaliações"})
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Curso novo no Tô de Bolsa</span>
              )}
            </div>
          </div>
          <DiscountBadge percent={discount} />
        </div>


        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {COURSE_LEVEL_LABEL[course.level] ?? course.level}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {MODALITY_LABEL[course.modality] ?? course.modality}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {SHIFT_LABEL[course.shift] ?? course.shift}
          </Badge>
        </div>

        <div className="px-5 pb-4 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">
              {unit.name} · {unit.city}/{unit.state}
            </span>
          </div>
          {course.duration_months ? (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duration_months} meses</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>{s.course_offering.vacancies_available} vagas disponíveis</span>
          </div>
        </div>

        <div className="mx-5 mb-3 rounded-xl bg-secondary/60 p-4">
          <div className="text-xs text-muted-foreground line-through">
            De {formatBRL(original)}/mês
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-primary leading-none">
              {formatBRL(final)}
            </span>
            <span className="text-sm font-medium text-foreground/70">/mês</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-success">
              Economize {formatBRL(savingMonth)} por mês
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-foreground/80">
              {discount}% de desconto
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Consulte as condições e regras de manutenção da bolsa.
          </div>
          <div className="mt-3">
            <UgeBadge />
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bolsas/$id" params={{ id: s.id }}>
              Ver detalhes
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/adquirir/$scholarshipId" params={{ scholarshipId: s.id }}>
              Garantir bolsa
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
