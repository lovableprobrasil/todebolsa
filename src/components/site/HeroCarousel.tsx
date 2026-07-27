import { useState, useEffect } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  GraduationCap,
  Award,
  BookOpen,
  School,
  Languages,
  Briefcase,
  MonitorPlay,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { getCampaignByLevel, CampaignLevel } from "@/lib/homepage/campaigns";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

export function HeroCarousel() {
  const search = useSearch({ from: "/" }) as any;
  const initialLevel = (search.nivel?.toUpperCase() as CampaignLevel) || "GRADUACAO";
  const [activeLevel, setActiveLevel] = useState<CampaignLevel>(initialLevel);
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["homepage-campaign", activeLevel],
    queryFn: () => getCampaignByLevel(activeLevel),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  // Sync state with URL
  useEffect(() => {
    if (search.nivel) {
      const level = search.nivel.toUpperCase() as CampaignLevel;
      if (level !== activeLevel) {
        setActiveLevel(level);
        setCurrentSlide(0);
      }
    }
  }, [search.nivel]);

  const handleLevelChange = (level: CampaignLevel) => {
    setActiveLevel(level);
    setCurrentSlide(0);
    navigate({
      to: "/",
      search: (prev: any) => ({ ...prev, nivel: level.toLowerCase() }),
      replace: true,
    });
    trackEvent("education_level_selected", {
      entityType: "campaign",
      metadata: { level },
    });
  };

  const nextSlide = () => {
    if (!campaign?.main_banners?.length) return;
    setCurrentSlide((prev) => (prev + 1) % campaign.main_banners.length);
  };

  const prevSlide = () => {
    if (!campaign?.main_banners?.length) return;
    setCurrentSlide((prev) => (prev - 1 + campaign.main_banners.length) % campaign.main_banners.length);
  };

  const activeBanner = campaign?.main_banners?.[currentSlide];

  const levels: { id: CampaignLevel; label: string; icon: any }[] = [
    { id: "GRADUACAO", label: "Graduação", icon: GraduationCap },
    { id: "POS_GRADUACAO", label: "Pós-graduação", icon: Award },
    { id: "TECNICO", label: "Técnico", icon: Briefcase },
    { id: "ESCOLAS", label: "Escolas", icon: School },
    { id: "PROFISSIONALIZANTE", label: "Profissionalizante", icon: BookOpen },
    { id: "EJA", label: "EJA", icon: GraduationCap },
    { id: "CURSO_LIVRE", label: "Cursos Livres", icon: Sparkles },
    { id: "IDIOMAS", label: "Idiomas", icon: Languages },
    { id: "OUTROS", label: "Mais cursos", icon: Play },
  ];

  return (
    <section className="relative bg-brand-ink text-white">
      {/* 1. BANNER PROMOCIONAL ROTATIVO (Container principal) */}
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-8 pb-32 md:pt-12 md:pb-40">
        {/* Dynamic Background Gradient (Behind Banner Content) */}
        <div 
          className="absolute inset-0 opacity-40 transition-colors duration-500 rounded-3xl overflow-hidden pointer-events-none"
          style={{ 
            background: activeLevel === 'GRADUACAO' ? 'radial-gradient(circle at top right, #4F46E5, transparent)' : 
                        activeLevel === 'POS_GRADUACAO' ? 'radial-gradient(circle at top right, #312E81, transparent)' :
                        activeLevel === 'TECNICO' ? 'radial-gradient(circle at top right, #7C3AED, transparent)' :
                        'radial-gradient(circle at top right, #4F46E5, transparent)'
          }} 
        />

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center min-h-[400px]">
          {/* Main Banner Content */}
          <div className="relative z-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-32 bg-white/10 rounded" />
                <div className="h-16 w-full bg-white/10 rounded" />
                <div className="h-8 w-2/3 bg-white/10 rounded" />
              </div>
            ) : activeBanner ? (
              <div className="fade-in">
                {activeBanner.badge && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-highlight text-brand-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {activeBanner.badge}
                  </span>
                )}
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
                  {activeBanner.title}
                </h1>
                
                <p className="mt-6 text-lg text-white/80 max-w-xl">
                  {activeBanner.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-brand-highlight text-brand-ink hover:bg-brand-highlight/90 font-bold px-8 h-12 rounded-xl"
                    asChild
                  >
                    <Link to={activeBanner.cta_url || "/bolsas"}>
                      {activeBanner.cta_label || "Ver bolsas"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
            
            {/* Carousel Controls */}
            {campaign?.main_banners && campaign.main_banners.length > 1 && (
              <div className="flex items-center gap-3 mt-10">
                <button 
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-1.5">
                  {campaign.main_banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        currentSlide === i ? "w-6 bg-brand-highlight" : "w-1.5 bg-white/30"
                      )}
                      aria-label={`Ir para slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. CARD DE BUSCA SOBREPOSTO AO BANNER (Abaixo do conteúdo do banner no grid, mas posicionado com absolute/negative margin) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-full max-w-[1040px] px-4 z-20">
          <div className="bg-white rounded-[18px] shadow-2xl overflow-hidden border border-brand-ink/5">
            {/* BARRA DE ABAS INTEGRADA */}
            <div role="tablist" className="flex overflow-x-auto no-scrollbar bg-[#0B1020]">
              {levels.map((l) => (
                <button
                  key={l.id}
                  role="tab"
                  aria-selected={activeLevel === l.id}
                  onClick={() => handleLevelChange(l.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 text-xs font-bold transition-all border-r border-white/5 last:border-r-0 min-w-[100px]",
                    activeLevel === l.id 
                      ? "bg-white text-brand-highlight" 
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <l.icon className={cn("h-5 w-5", activeLevel === l.id ? "text-brand-highlight" : "text-white/50")} />
                  <span className="whitespace-nowrap">{l.label}</span>
                </button>
              ))}
            </div>

            {/* CORPO DO FORMULÁRIO */}
            <div className="p-6 md:p-10 text-brand-ink">
              <SearchBar 
                activeLevel={activeLevel}
                initialLevel={activeLevel === 'ESCOLAS' ? 'MEDIO' : activeLevel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRÊS MICROBANNERS (Abaixo do conjunto banner + busca) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
             ))
          ) : campaign?.micro_banners?.map((mb) => (
            <Link 
              key={mb.id}
              to={mb.cta_url || "/bolsas"}
              className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-lg mb-1">{mb.title}</h3>
                <p className="text-sm text-white/60 line-clamp-2">{mb.description}</p>
                <span className="mt-4 inline-flex items-center text-xs font-bold text-brand-highlight group-hover:underline">
                  {mb.cta_label || "Ver bolsas"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-brand-highlight ml-4 shrink-0">
                <MonitorPlay className="h-6 w-6" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
