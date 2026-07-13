import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Percent,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Search,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type Slide = {
  id: string;
  eyebrow: string;
  eyebrowIcon: typeof Percent;
  title: React.ReactNode;
  text: string;
  primary: { label: string; to: string; search?: Record<string, string> };
  secondary?: { label: string; to: string; search?: Record<string, string> };
  highlight: string;
  accent: "primary" | "brand-blue" | "accent";
  showSearch?: boolean;
};

const SLIDES: Slide[] = [
  {
    id: "principal",
    eyebrow: "Bolsas com até 90% de desconto",
    eyebrowIcon: Percent,
    title: (
      <>
        As melhores bolsas de estudo{" "}
        <span className="text-primary">estão aqui</span>
      </>
    ),
    text: "Encontre faculdades e instituições reconhecidas e economize na mensalidade durante todo o curso.",
    primary: { label: "Encontrar minha bolsa", to: "/bolsas" },
    secondary: { label: "Ver todas as ofertas", to: "/bolsas" },
    highlight: "Marketplace nacional de bolsas de estudo",
    accent: "primary",
    showSearch: true,
  },
  {
    id: "economia",
    eyebrow: "Educação de qualidade com economia real",
    eyebrowIcon: TrendingUp,
    title: (
      <>
        Estude mais{" "}
        <span className="text-primary">pagando menos</span>
      </>
    ),
    text: "Compare bolsas, cursos e instituições e escolha a oportunidade que combina com seus objetivos e seu orçamento.",
    primary: { label: "Buscar bolsas", to: "/bolsas" },
    highlight: "Compare cursos e mensalidades em segundos",
    accent: "primary",
  },
  {
    id: "facilidade",
    eyebrow: "Processo 100% online e sem burocracia",
    eyebrowIcon: Sparkles,
    title: (
      <>
        Sua bolsa <span className="text-primary">sem burocracia</span>
      </>
    ),
    text: "Escolha o curso, confirme seus dados e garanta sua oportunidade de forma simples, rápida e digital.",
    primary: { label: "Quero minha bolsa", to: "/bolsas" },
    secondary: { label: "Como funciona", to: "/faq" },
    highlight: "Contratação rápida · Sem filas · Sem processos complicados",
    accent: "brand-blue",
  },
  {
    id: "desconto",
    eyebrow: "Desconto que acompanha sua formação",
    eyebrowIcon: ShieldCheck,
    title: (
      <>
        Desconto durante{" "}
        <span className="text-primary">toda a sua formação</span>
      </>
    ),
    text: "Encontre bolsas com mensalidade reduzida ao longo do curso, conforme as regras de cada oferta.",
    primary: { label: "Conhecer as bolsas", to: "/bolsas" },
    highlight: "Planeje hoje a economia da sua formação",
    accent: "primary",
  },
  {
    id: "transformacao",
    eyebrow: "Graduação, pós, técnico, idiomas e mais",
    eyebrowIcon: GraduationCap,
    title: (
      <>
        O próximo passo da sua carreira{" "}
        <span className="text-primary">começa aqui</span>
      </>
    ),
    text: "Transforme seus planos em realidade com cursos para todas as fases da vida e todos os perfis.",
    primary: { label: "Escolher meu curso", to: "/bolsas" },
    secondary: { label: "Explorar instituições", to: "/bolsas" },
    highlight: "Diversidade de cursos, modalidades e instituições",
    accent: "brand-blue",
  },
];

const AUTOPLAY_MS = 6500;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length),
    [],
  );
  const goTo = useCallback((n: number) => setIndex(n), []);

  useEffect(() => {
    if (paused || userPaused || reduced) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, userPaused, reduced]);

  useEffect(() => {
    void trackEvent("hero_slide_view", {
      entityType: "hero_slide",
      entityId: SLIDES[index].id,
      metadata: { index },
    });
  }, [index]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques Tô de Bolsa"
      className="relative overflow-hidden bg-hero text-hero-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-blue/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-14 md:pt-16 md:pb-20 min-h-[560px] md:min-h-[620px]">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-14 items-center">
          {/* Text column */}
          <div className="relative">
            {SLIDES.map((s, i) => {
              const Icon = s.eyebrowIcon;
              const active = i === index;
              return (
                <div
                  key={s.id}
                  aria-hidden={!active}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${SLIDES.length}`}
                  className={cn(
                    "transition-all duration-500 ease-out",
                    active
                      ? "relative opacity-100 translate-y-0"
                      : "pointer-events-none absolute inset-0 opacity-0 translate-y-2",
                  )}
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur px-3 py-1.5 text-xs font-semibold text-hero-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {s.eyebrow}
                  </div>

                  <h1 className="mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                    {s.title}
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-hero-muted max-w-xl">
                    {s.text}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-hero-muted">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{s.highlight}</span>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="rounded-xl h-12 px-6 text-base"
                      asChild
                      onClick={() =>
                        void trackEvent("hero_cta_click", {
                          entityType: "hero_slide",
                          entityId: s.id,
                          metadata: { cta: "primary" },
                        })
                      }
                    >
                      <Link to={s.primary.to} search={s.primary.search}>
                        {s.primary.label} <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    {s.secondary && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-xl h-12 px-6 text-base bg-transparent border-white/25 text-hero-foreground hover:bg-white/10 hover:text-hero-foreground"
                        asChild
                        onClick={() =>
                          void trackEvent("hero_cta_click", {
                            entityType: "hero_slide",
                            entityId: s.id,
                            metadata: { cta: "secondary" },
                          })
                        }
                      >
                        <Link to={s.secondary.to} search={s.secondary.search}>
                          {s.secondary.label}
                        </Link>
                      </Button>
                    )}
                  </div>

                  {s.showSearch && <HeroSearch onFocusChange={setPaused} />}
                </div>
              );
            })}

            {/* Trust strip */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-hero-muted">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Site seguro</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Bolsas verificadas</span>
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-primary" /> Instituições parceiras</span>
              <span className="inline-flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-primary" /> Descontos transparentes</span>
            </div>
          </div>

          {/* Visual column */}
          <div className="relative hidden lg:block">
            <div aria-hidden className="absolute inset-x-8 bottom-6 h-40 rounded-[3rem] bg-primary/25 blur-3xl" />
            <div className="relative">
              <img
                src={heroStudent}
                alt="Estudante brasileiro sorrindo com carteira digital de estudante"
                width={896}
                height={1152}
                fetchPriority="high"
                decoding="async"
                className="relative w-full h-auto max-h-[560px] object-contain object-bottom mx-auto drop-shadow-2xl"
              />
              {/* Floating badge that changes per slide */}
              <div
                key={slide.id}
                className="absolute top-6 right-2 rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-4 py-3 shadow-[var(--shadow-elegant)] animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="text-[10px] uppercase tracking-wider text-hero-muted font-semibold">
                  Destaque
                </div>
                <div className="mt-0.5 font-display font-extrabold text-lg leading-tight max-w-[200px]">
                  {slide.highlight}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Slide anterior"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur text-hero-foreground hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próximo slide"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur text-hero-foreground hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setUserPaused((v) => !v)}
              aria-label={userPaused ? "Retomar rotação automática" : "Pausar rotação automática"}
              aria-pressed={userPaused}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur text-hero-foreground hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2" role="tablist" aria-label="Selecionar slide">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir para o slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                  i === index ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>

          <div className="hidden md:block text-xs text-hero-muted tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Compact search embedded inside the first slide.
 * Pauses carousel while the user is interacting.
 */
function HeroSearch({ onFocusChange }: { onFocusChange: (paused: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [modality, setModality] = useState<string>("");

  const isEad = modality === "EAD";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void trackEvent("hero_search_submit", {
      entityType: "hero_search",
      metadata: { q, city, modality },
    });
    navigate({
      to: "/bolsas",
      search: {
        q: q.trim() || undefined,
        city: !isEad && city.trim() ? city.trim() : undefined,
        modality: modality || undefined,
      },
    });
  }

  return (
    <form
      onSubmit={submit}
      onFocus={() => onFocusChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onFocusChange(false);
      }}
      className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur p-3 md:p-3 shadow-[var(--shadow-elegant)]"
      aria-label="Buscar bolsas"
    >
      <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hero-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Qual curso você procura?"
            aria-label="Curso, instituição ou área"
            className="h-12 pl-9 bg-white/95 text-foreground placeholder:text-muted-foreground border-transparent"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hero-muted" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={isEad ? "Curso à distância" : "Onde você quer estudar?"}
            disabled={isEad}
            aria-label="Cidade"
            className="h-12 pl-9 bg-white/95 text-foreground placeholder:text-muted-foreground border-transparent"
          />
        </div>
        <Select value={modality || "ALL"} onValueChange={(v) => setModality(v === "ALL" ? "" : v)}>
          <SelectTrigger
            aria-label="Modalidade"
            className="h-12 bg-white/95 text-foreground border-transparent"
          >
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as modalidades</SelectItem>
            <SelectItem value="PRESENCIAL">Presencial</SelectItem>
            <SelectItem value="SEMIPRESENCIAL">Semipresencial</SelectItem>
            <SelectItem value="EAD">EAD</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" className="h-12 px-6 font-semibold whitespace-nowrap">
          Buscar bolsas
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-hero-muted">
        Consulte as condições, disponibilidade e regras de manutenção de cada bolsa.
      </p>
    </form>
  );
}
