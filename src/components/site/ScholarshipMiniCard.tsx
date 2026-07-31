import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatBRL, MODALITY_LABEL } from "@/lib/format";
import type { ScholarshipListItem } from "@/lib/scholarships";
import { trackEvent } from "@/lib/analytics";

/**
 * Cartão compacto de bolsa usado nas prateleiras horizontais da home.
 * Logo da instituição no topo, curso, modalidade/cidade e preço com/sem bolsa.
 */
export function ScholarshipMiniCard({ s }: { s: ScholarshipListItem }) {
  const course = s.course_offering.course;
  const unit = s.course_offering.institution_unit;
  const inst = course.institution;
  const original = Number(course.original_price);
  const final = Number(s.price_with_scholarship);

  return (
    <Link
      to="/bolsas/$id"
      params={{ id: s.id }}
      onClick={() =>
        void trackEvent("scholarship_click", {
          entityType: "scholarship",
          entityId: s.id,
          metadata: { cta: "shelf", institution: inst.trade_name },
        })
      }
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 items-center">
          {inst.logo_url ? (
            <img
              src={inst.logo_url}
              alt={`Logo ${inst.trade_name}`}
              loading="lazy"
              decoding="async"
              className="max-h-10 max-w-[130px] object-contain object-left"
            />
          ) : (
            <span className="font-display text-sm font-extrabold text-brand-blue">
              {inst.trade_name}
            </span>
          )}
        </div>
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-ink/70 transition-colors group-hover:text-primary"
        >
          <Heart className="h-5 w-5" />
        </span>
      </div>

      <h3 className="mt-4 font-semibold leading-snug text-brand-ink line-clamp-2">
        {course.name}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div className="min-w-0 text-sm text-muted-foreground">
          <div className="truncate">{MODALITY_LABEL[course.modality] ?? course.modality}</div>
          <div className="truncate">
            {unit.city} - {unit.state}
          </div>
        </div>
        <div className="text-right">
          {original > final ? (
            <div className="text-xs text-warning-ink/70 line-through">{formatBRL(original)}</div>
          ) : null}
          <div className="font-display text-lg font-extrabold text-brand-ink">
            {formatBRL(final)}
          </div>
        </div>
      </div>
    </Link>
  );
}
