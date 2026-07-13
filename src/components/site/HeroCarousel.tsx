import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  GraduationCap,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroStudent from "@/assets/hero-student-new.jpg";
import { trackEvent } from "@/lib/analytics";

/**
 * Hero principal — Tô de Bolsa 2026 (Edtech Indigo).
 * Nome exportado é mantido (HeroCarousel) para preservar imports existentes,
 * mas o componente agora é um hero estático conforme a nova identidade visual.
 */
export function HeroCarousel() {
  return (
    <section
      aria-label="Encontre a bolsa que cabe nos seus planos"
      className="relative overflow-hidden text-hero-foreground"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Brilho radial violeta discreto à direita */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 82% 40%, rgba(124,58,237,0.35), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "rgba(79,70,229,0.28)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Texto */}
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur px-3 py-1.5 text-xs font-semibold">
              <BadgePercent className="h-3.5 w-3.5" style={{ color: "var(--brand-highlight)" }} />
              Bolsas com até 90% de desconto
            </span>

            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Encontre a bolsa que{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #FBBF24 0%, #F59E0B 100%)",
                }}
              >
                cabe nos seus planos
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-hero-muted max-w-xl">
              Compare cursos e instituições e economize na mensalidade durante
              sua formação.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                asChild
                className="rounded-xl h-12 px-6 text-base font-semibold shadow-[var(--shadow-elegant)] transition-colors"
                style={{
                  backgroundColor: "var(--brand-highlight)",
                  color: "var(--brand-ink)",
                }}
                onClick={() =>
                  void trackEvent("hero_cta_click", {
                    entityType: "hero",
                    entityId: "primary",
                    metadata: { cta: "encontrar" },
                  })
                }
              >
                <Link to="/bolsas">
                  Encontrar minha bolsa
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-xl h-12 px-6 text-base bg-transparent border-white/40 text-hero-foreground hover:bg-white/10 hover:text-hero-foreground"
                onClick={() =>
                  void trackEvent("hero_cta_click", {
                    entityType: "hero",
                    entityId: "secondary",
                    metadata: { cta: "como-funciona" },
                  })
                }
              >
                <Link to="/faq">Ver como funciona</Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-hero-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--brand-highlight)" }} /> Site seguro
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--brand-highlight)" }} /> Bolsas verificadas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" style={{ color: "var(--brand-highlight)" }} /> Instituições parceiras
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-x-8 bottom-6 h-40 rounded-[3rem] blur-3xl"
              style={{ background: "rgba(124,58,237,0.35)" }}
            />
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-[2rem] border border-white/10 shadow-[var(--shadow-elegant)]">
              <img
                src={heroStudent}
                alt="Estudante brasileira estudando em ambiente moderno"
                width={1200}
                height={1400}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Card flutuante 1 — Bolsa exemplar */}
            <div className="hidden sm:block absolute -left-2 sm:-left-6 top-8 md:top-16 rounded-2xl bg-white/95 backdrop-blur text-foreground shadow-[var(--shadow-elegant)] border border-white/40 p-4 w-56">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
                Administração
              </div>
              <div
                className="mt-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: "var(--warning-soft)",
                  color: "var(--warning-ink)",
                }}
              >
                Bolsa de 65%
              </div>
              <div className="mt-2 text-xs text-muted-foreground line-through">
                De R$ 749/mês
              </div>
              <div className="font-display text-xl font-extrabold" style={{ color: "var(--brand-primary)" }}>
                R$ 262<span className="text-sm font-semibold text-foreground/70">/mês</span>
              </div>
            </div>

            {/* Card flutuante 2 — Modalidade */}
            <div className="hidden sm:block absolute -right-2 sm:-right-4 bottom-6 md:bottom-10 rounded-2xl bg-white/95 backdrop-blur text-foreground shadow-[var(--shadow-elegant)] border border-white/40 p-4 w-52">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <MonitorPlay className="h-3.5 w-3.5" style={{ color: "var(--brand-secondary)" }} />
                Curso 100% online
              </div>
              <div className="mt-1 text-sm font-bold text-foreground">
                Instituição parceira
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--success)" }}>
                <Wifi className="h-3.5 w-3.5" />
                Estude de onde estiver
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
