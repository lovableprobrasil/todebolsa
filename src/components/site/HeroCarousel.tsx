import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Award, 
  Briefcase, 
  School, 
  Sparkles,
  MonitorPlay,
  Play,
  Languages,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLevel } from "@/lib/homepage/campaigns";
import { SearchBar } from "./SearchBar";
import { create } from "zustand";

// Store simples para sincronizar o nível entre componentes
interface CampaignStore {
  activeLevel: CampaignLevel;
  setActiveLevel: (level: CampaignLevel) => void;
}

const useCampaignStore = create<CampaignStore>((set) => ({
  activeLevel: "GRADUACAO",
  setActiveLevel: (level: CampaignLevel) => set({ activeLevel: level }),
}));

export function HeroCarousel({ 
  showSearch = true, 
  onlySearch = false 
}: { 
  showSearch?: boolean; 
  onlySearch?: boolean 
}) {
  const { activeLevel, setActiveLevel } = useCampaignStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Load campaign for the active education level
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["homepage-campaign", activeLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_campaign_groups")
        .select(`
          *,
          main_banners:homepage_main_banners(*),
          micro_banners:homepage_micro_banners(*)
        `)
        .eq("education_level", activeLevel)
        .eq("status", "ACTIVE")
        .maybeSingle();
      
      if (error) throw error;
      
      // Sort banners by priority/display_order
      if (data?.main_banners) {
        data.main_banners.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      }
      if (data?.micro_banners) {
        data.micro_banners.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      }
      
      return data;
    }
  });

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

  const activeBanner = campaign?.main_banners?.[currentSlide];

  useEffect(() => {
    setCurrentSlide(0);
  }, [activeLevel]);

  useEffect(() => {
    if (!campaign?.main_banners || campaign.main_banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % campaign.main_banners.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [campaign?.main_banners]);

  const handleLevelChange = (level: CampaignLevel) => {
    setActiveLevel(level);
  };

  const nextSlide = () => {
    if (!campaign?.main_banners) return;
    setCurrentSlide((prev) => (prev + 1) % campaign.main_banners.length);
  };

  const prevSlide = () => {
    if (!campaign?.main_banners) return;
    setCurrentSlide((prev) => (prev - 1 + campaign.main_banners.length) % campaign.main_banners.length);
  };

  if (onlySearch) {
    return (
      <div className="bg-white rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-brand-ink/5 scholarship-search-card">
        {/* Education Level Tabs - Integrated Header */}
        <div role="tablist" className="flex overflow-x-auto no-scrollbar bg-[#0f172a] education-level-tabs">
          {levels.map((l, idx) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={activeLevel === l.id}
              onClick={() => handleLevelChange(l.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-2.5 px-6 py-5 text-xs font-black transition-all border-r border-white/5 last:border-r-0 min-w-[115px] relative group",
                activeLevel === l.id 
                  ? "bg-white text-brand-blue" 
                  : "bg-[#172033] text-white/60 hover:text-white hover:bg-white/5",
                idx === 0 && "rounded-tl-[24px]",
                idx === levels.length - 1 && "rounded-tr-[24px]"
              )}
            >
              <l.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", activeLevel === l.id ? "text-brand-blue" : "text-white/40")} />
              <span className="whitespace-nowrap tracking-tight uppercase text-[10px]">{l.label}</span>
              {activeLevel === l.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue" />
              )}
            </button>
          ))}
        </div>

        {/* Search Form Body */}
        <div className="p-8 md:p-12 text-brand-ink search-form-body">
          <SearchBar 
            activeLevel={activeLevel}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden campaign-hero bg-[#0f172a]">
      {/* 1. BANNER PROMOCIONAL ROTATIVO */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="relative overflow-hidden rounded-[32px] bg-brand-ink min-h-[360px] md:min-h-[460px] group">
          {/* Background Image / Gradient */}
          {activeBanner?.image_desktop ? (
            <div className="absolute inset-0">
              <img 
                src={activeBanner.image_desktop} 
                alt={activeBanner.alt_text || ""}
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: (activeBanner.theme as any)?.focalPoint || 'center right' 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/80 to-transparent" />
            </div>
          ) : (
            <div 
              className="absolute inset-0 opacity-60 transition-colors duration-500"
              style={{ 
                background: activeLevel === 'GRADUACAO' ? 'radial-gradient(circle at top right, #3b82f6, transparent)' : 
                            activeLevel === 'POS_GRADUACAO' ? 'radial-gradient(circle at top right, #6366f1, transparent)' :
                            activeLevel === 'TECNICO' ? 'radial-gradient(circle at top right, #8b5cf6, transparent)' :
                            activeLevel === 'ESCOLAS' ? 'radial-gradient(circle at top right, #f59e0b, transparent)' :
                            'radial-gradient(circle at top right, #3b82f6, transparent)'
              }} 
            />
          )}

          <div className="relative z-10 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center p-8 md:p-16 h-full">
            {/* Banner Content */}
            <div className="fade-in max-w-xl">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-32 bg-white/10 rounded" />
                  <div className="h-16 w-full bg-white/10 rounded" />
                  <div className="h-8 w-2/3 bg-white/10 rounded" />
                </div>
              ) : activeBanner ? (
                <>
                  {activeBanner.badge && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-highlight text-brand-ink px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] mb-6">
                      <Sparkles className="h-3 w-3" />
                      {activeBanner.badge}
                    </span>
                  )}
                  
                  <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
                    {activeBanner.title}
                  </h1>
                  
                  <p className="mt-6 text-lg md:text-xl text-white/90 font-medium leading-relaxed line-clamp-3">
                    {activeBanner.description}
                  </p>

                  <div className="mt-8">
                    <Button
                      size="lg"
                      className="bg-brand-highlight text-brand-ink hover:bg-brand-highlight/90 font-black px-8 h-12 rounded-xl shadow-xl shadow-brand-highlight/10 transition-all hover:scale-105 active:scale-95"
                      asChild
                    >
                      <Link to={activeBanner.cta_url || "/bolsas"}>
                        {activeBanner.cta_label || "Ver bolsas"}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black leading-[1.1] text-white">
                    Sua bolsa de estudos está aqui
                  </h1>
                  <p className="mt-6 text-lg text-white/90">
                    Encontre as melhores oportunidades com descontos exclusivos em todo o Brasil.
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Carousel Controls */}
          {campaign?.main_banners && campaign.main_banners.length > 1 && (
            <div className="absolute bottom-8 left-8 md:left-16 flex items-center gap-4 z-20">
              <button 
                onClick={prevSlide}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/5"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {campaign.main_banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      currentSlide === i ? "w-8 bg-brand-highlight" : "w-1.5 bg-white/20"
                    )}
                    aria-label={`Ir para slide ${i + 1}`}
                  />
                ))}
              </div>
              <button 
                onClick={nextSlide}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/5"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="mx-auto w-full max-w-[1100px] px-4 -mt-16 md:-mt-24 relative z-20">
          {/* Redundancy check if not split */}
        </div>
      )}
    </section>
  );
}

export function MicrobannersSection() {
  const [activeLevel, setActiveLevel] = useState<CampaignLevel>("GRADUACAO");

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["homepage-microbanners", activeLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_campaign_groups")
        .select(`
          *,
          micro_banners:homepage_micro_banners(*)
        `)
        .eq("education_level", activeLevel)
        .eq("status", "ACTIVE")
        .maybeSingle();
      
      if (error) throw error;
      if (data?.micro_banners) {
        data.micro_banners.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      }
      return data;
    }
  });

  // Listener para sincronizar o nível ativo vindo da busca se necessário
  // Por simplicidade, as seções da home podem observar a mesma store ou context se necessário.
  // Como as abas estão na busca, vamos precisar de uma forma de notificar a home.

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pb-10">
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[2/1] bg-muted animate-pulse rounded-2xl" />
          ))
        ) : campaign?.micro_banners && campaign.micro_banners.length > 0 ? (
          campaign.micro_banners.slice(0, 3).map((mb) => (
            <Link 
              key={mb.id}
              to={mb.cta_url || "/bolsas"}
              className="group relative overflow-hidden rounded-2xl aspect-[2/1] bg-muted border border-border shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {mb.image_desktop ? (
                <img src={mb.image_desktop} alt={mb.alt_text || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-ink/5 flex items-center justify-center">
                   <div className="text-center p-4">
                     <h3 className="font-black text-lg text-brand-ink">{mb.title}</h3>
                     <p className="text-xs text-muted-foreground mt-1">{mb.description}</p>
                   </div>
                </div>
              )}
              {/* Overlay with CTA */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <h3 className="text-white font-black text-lg">{mb.title}</h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-1">{mb.description}</p>
                <span className="text-brand-highlight font-black text-xs uppercase flex items-center gap-2">
                  {mb.cta_label || "Ver mais"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))
        ) : (
          [1, 2, 3].map((i) => (
            <div key={i} className="aspect-[2/1] rounded-2xl border border-dashed border-border flex items-center justify-center bg-muted/20 opacity-40">
              <span className="text-xs font-medium">Microbanner {i}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
