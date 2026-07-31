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

export function HeroCarousel() {
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

  const activeBanner = (campaign?.main_banners && campaign.main_banners.length > 0) 
    ? campaign.main_banners[currentSlide % campaign.main_banners.length] 
    : null;

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
          {/* Full-image Banner Content */}
          <div className="absolute inset-0">
            {activeBanner?.image_desktop ? (
              <img 
                key={activeBanner.id}
                src={activeBanner.image_desktop} 
                alt={activeBanner.alt_text || ""}
                className="w-full h-full object-cover transition-opacity duration-500"
                style={{ 
                  objectPosition: (activeBanner.theme as any)?.focalPoint || 'center' 
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=1200';
                }}
              />
            ) : (
              <div 
                className="w-full h-full opacity-60 transition-colors duration-500"
                style={{ 
                  background: activeLevel === 'GRADUACAO' ? 'radial-gradient(circle at top right, #3b82f6, transparent)' : 
                              activeLevel === 'POS_GRADUACAO' ? 'radial-gradient(circle at top right, #6366f1, transparent)' :
                              activeLevel === 'TECNICO' ? 'radial-gradient(circle at top right, #8b5cf6, transparent)' :
                              activeLevel === 'ESCOLAS' ? 'radial-gradient(circle at top right, #f59e0b, transparent)' :
                              'radial-gradient(circle at top right, #3b82f6, transparent)'
                }} 
              />
            )}
            
            {/* Dynamic Text Overlay - Design Sinistro */}
            {activeBanner && (
              <div className="absolute inset-0 z-10 flex flex-col justify-center p-8 md:p-16 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none">
                <div className="max-w-2xl transition-all duration-700 transform translate-y-0 opacity-100">
                  {activeBanner.badge && (
                    <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-widest uppercase bg-brand-highlight text-brand-ink rounded-full animate-bounce">
                      {activeBanner.badge}
                    </span>
                  )}
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] mb-4 tracking-tighter drop-shadow-2xl">
                    {activeBanner.title.split(' - ')[0]}
                    <span className="block text-brand-highlight mt-2">
                      {activeBanner.title.split(' - ')[1] || ''}
                    </span>
                  </h2>
                  {activeBanner.description && (
                    <p className="text-lg md:text-xl text-white/90 font-medium max-w-lg mb-8 drop-shadow-md">
                      {activeBanner.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                     <div className="h-12 px-8 rounded-full bg-brand-highlight text-brand-ink font-black flex items-center justify-center group-hover:scale-105 transition-transform">
                        {activeBanner.cta_label || 'GARANTIR BOLSA'}
                     </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Overlay link to make the whole banner clickable */}
            {activeBanner && (
              <Link 
                to={activeBanner.cta_url || "/bolsas"} 
                className="absolute inset-0 z-20 cursor-pointer"
                aria-label={activeBanner.title}
              />
            )}
          </div>
          
          {/* Carousel Controls */}
          {campaign?.main_banners && campaign.main_banners.length > 1 && (
            <>
              {/* Lateral Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/10 z-30 group hidden sm:flex items-center justify-center"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              <button 
                onClick={nextSlide}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/10 z-30 group hidden sm:flex items-center justify-center"
                aria-label="Próximo"
              >
                <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Centralized Dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                {campaign.main_banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-500 shadow-sm",
                      currentSlide === i ? "w-8 bg-brand-highlight" : "w-2 bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Ir para slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
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
  const { activeLevel } = useCampaignStore();

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
                <>
                  <img 
                    src={mb.image_desktop} 
                    alt={mb.alt_text || ""} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  {/* Microbanner Text Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <h3 className="text-white font-black text-lg leading-tight drop-shadow-lg group-hover:text-brand-highlight transition-colors">
                      {mb.title}
                    </h3>
                    {mb.description && (
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1 drop-shadow-md">
                        {mb.description}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-brand-ink/5 flex items-center justify-center">
                   <div className="text-center p-4">
                     <h3 className="font-black text-lg text-brand-ink">{mb.title}</h3>
                     <p className="text-xs text-muted-foreground mt-1">{mb.description}</p>
                   </div>
                </div>
              )}
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
