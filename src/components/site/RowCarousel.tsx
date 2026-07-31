import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrossel horizontal com rolagem por "páginas" e indicadores centralizados,
 * no padrão das prateleiras de conteúdo da home.
 */
export function RowCarousel({
  children,
  itemClassName = "w-[280px] sm:w-[300px]",
  className,
}: {
  children: ReactNode[];
  itemClassName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)));
      setPages(total);
      setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [children.length]);

  const go = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto scroll-snap-x pb-2 -mx-1 px-1"
      >
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 scroll-snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-[var(--shadow-card)] text-brand-blue hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo"
            className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-[var(--shadow-card)] text-brand-blue hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para a página ${i + 1}`}
                onClick={() =>
                  ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: "smooth" })
                }
                className={cn(
                  "h-2 rounded-full transition-all",
                  page === i ? "w-7 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-2xl md:text-[28px] font-extrabold tracking-tight text-brand-ink">
          {title}
        </h2>
        {subtitle ? (
          <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
