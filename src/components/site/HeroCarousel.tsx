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
    <section className="relative overflow-hidden bg-brand-ink text-white">
      {/* Dynamic Background Gradient */}
      <div 
        className="absolute inset-0 opacity-40 transition-colors duration-500"
        style={{ 
          background: activeLevel === 'GRADUACAO' ? 'radial-gradient(circle at top right, #4F46E5, transparent)' : 
                      activeLevel === 'POS_GRADUACAO' ? 'radial-gradient(circle at top right, #312E81, transparent)' :
                      activeLevel === 'TECNICO' ? 'radial-gradient(circle at top right, #7C3AED, transparent)' :
                      'radial-gradient(circle at top right, #4F46E5, transparent)'
        }} 
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-12 md:pb-24">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2 border-b border-white/10">
          {levels.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={activeLevel === l.id}
              onClick={() => handleLevelChange(l.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition-all border-b-2",
                activeLevel === l.id 
                  ? "bg-white/10 border-brand-highlight text-brand-highlight" 
                  : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </button>
          ))}
        </div>

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
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
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

          {/* Search Form Card (Overlay) */}
          <div className="relative lg:mt-0 mt-8 z-20">
             <div className="bg-white rounded-3xl p-1 shadow-2xl">
               <div className="bg-white rounded-[2.8rem] p-6 md:p-8 text-brand-ink">
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                   Onde quer estudar?
                 </h2>
                 <SearchBar 
                   initialLevel={activeLevel === 'ESCOLAS' ? 'FUNDAMENTAL' : activeLevel}
                   showLevelChips={false}
                 />
               </div>
             </div>
          </div>
        </div>

        {/* 3 Microbanners below */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
             ))
          ) : campaign?.micro_banners?.map((mb) => (
            <Link 
              key={mb.id}
              to={mb.cta_url || "/bolsas"}
              className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-lg mb-1">{mb.title}</h3>
                <p className="text-sm text-white/60">{mb.description}</p>
                <span className="mt-3 inline-flex items-center text-xs font-bold text-brand-highlight group-hover:underline">
                  {mb.cta_label || "Ver bolsas"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-brand-highlight">
                <MonitorPlay className="h-6 w-6" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
