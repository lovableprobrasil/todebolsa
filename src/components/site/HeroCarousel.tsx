import { useState, useEffect } from "react";
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

export function HeroCarousel({ 
  showSearch = true, 
  onlySearch = false 
}: { 
  showSearch?: boolean; 
  onlySearch?: boolean 
}) {
  const [activeLevel, setActiveLevel] = useState<CampaignLevel>("GRADUACAO");
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

  return (
    <section className="relative bg-brand-ink text-white overflow-hidden">
      {/* 1. BANNER PROMOCIONAL ROTATIVO (Container principal) */}
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-10 pb-40 md:pt-16 md:pb-52">
        {/* Dynamic Background Gradient (Behind Banner Content) */}
        <div 
          className="absolute inset-0 opacity-40 transition-colors duration-500 rounded-3xl overflow-hidden pointer-events-none"
          style={{ 
            background: activeLevel === 'GRADUACAO' ? 'radial-gradient(circle at top right, #3b82f6, transparent)' : 
                        activeLevel === 'POS_GRADUACAO' ? 'radial-gradient(circle at top right, #6366f1, transparent)' :
                        activeLevel === 'TECNICO' ? 'radial-gradient(circle at top right, #8b5cf6, transparent)' :
                        activeLevel === 'ESCOLAS' ? 'radial-gradient(circle at top right, #f59e0b, transparent)' :
                        'radial-gradient(circle at top right, #3b82f6, transparent)'
          }} 
        />

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center min-h-[420px]">
          {/* Main Banner Content */}
          <div className="relative z-10 lg:pl-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-32 bg-white/10 rounded" />
                <div className="h-16 w-full bg-white/10 rounded" />
                <div className="h-8 w-2/3 bg-white/10 rounded" />
              </div>
            ) : activeBanner ? (
              <div className="fade-in">
                {activeBanner.badge && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-highlight text-brand-ink px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] mb-6">
                    <Sparkles className="h-3 w-3" />
                    {activeBanner.badge}
                  </span>
                )}
                
                <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black leading-[1.05] tracking-tight text-white drop-shadow-md">
                  {activeBanner.title}
                </h1>
                
                <p className="mt-8 text-xl text-white/90 max-w-xl font-medium leading-relaxed">
                  {activeBanner.description}
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-brand-highlight text-brand-ink hover:bg-brand-highlight/90 font-black px-10 h-14 rounded-xl shadow-xl shadow-brand-highlight/20 transition-all hover:scale-105 active:scale-95 text-base"
                    asChild
                  >
                    <Link to={activeBanner.cta_url || "/bolsas"}>
                      {activeBanner.cta_label || "Ver bolsas"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
               <div className="fade-in">
                  <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black leading-[1.05] tracking-tight text-white">
                    Sua bolsa de estudos está aqui
                  </h1>
                  <p className="mt-8 text-xl text-white/90 max-w-xl font-medium">
                    Encontre as melhores oportunidades com descontos exclusivos em todo o Brasil.
                  </p>
               </div>
            )}
            
            {/* Carousel Controls */}
            {campaign?.main_banners && campaign.main_banners.length > 1 && (
              <div className="flex items-center gap-4 mt-12 lg:pl-2">
                <button 
                  onClick={prevSlide}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/5 backdrop-blur-sm active:scale-90"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {campaign.main_banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-500",
                        currentSlide === i ? "w-10 bg-brand-highlight shadow-[0_0_15px_rgba(255,204,0,0.5)]" : "w-2 bg-white/20 hover:bg-white/40"
                      )}
                      aria-label={`Ir para slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={nextSlide}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/5 backdrop-blur-sm active:scale-90"
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. CARD DE BUSCA SOBREPOSTO AO BANNER */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-full max-w-[1100px] px-4 z-20">
          <div className="bg-white rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-brand-ink/5">
            {/* BARRA DE ABAS INTEGRADA - Estilo Quero Bolsa */}
            <div role="tablist" className="flex overflow-x-auto no-scrollbar bg-[#0f172a]">
              {levels.map((l) => (
                <button
                  key={l.id}
                  role="tab"
                  aria-selected={activeLevel === l.id}
                  onClick={() => handleLevelChange(l.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-2.5 px-6 py-5 text-xs font-black transition-all border-r border-white/5 last:border-r-0 min-w-[115px] relative group",
                    activeLevel === l.id 
                      ? "bg-white text-brand-blue" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
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

            {/* CORPO DO FORMULÁRIO */}
            <div className="p-8 md:p-12 text-brand-ink">
              <SearchBar 
                activeLevel={activeLevel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MICROBANNERS */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-44 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
             ))
          ) : campaign?.micro_banners && campaign.micro_banners.length > 0 ? (
            campaign.micro_banners.map((mb) => (
              <Link 
                key={mb.id}
                to={mb.cta_url || "/bolsas"}
                className="group relative overflow-hidden rounded-2xl bg-[#172033]/50 border border-white/10 p-7 hover:bg-[#1e293b]/60 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm"
              >
                <div className="pr-4">
                  <h3 className="font-black text-lg mb-2 text-white group-hover:text-brand-highlight transition-colors">{mb.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-2 leading-relaxed mb-4">{mb.description}</p>
                  <span className="inline-flex items-center text-xs font-black text-brand-highlight uppercase tracking-wider">
                    {mb.cta_label || "Ver bolsas"}
                    <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-brand-highlight group-hover:bg-brand-highlight group-hover:text-brand-ink transition-all duration-300 shrink-0 shadow-inner">
                  <MonitorPlay className="h-7 w-7" />
                </div>
              </Link>
            ))
          ) : (
            // Fallback microbanners if none in DB
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-7 flex items-center justify-between opacity-50">
                <div className="h-20 w-full animate-pulse bg-white/10 rounded" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
