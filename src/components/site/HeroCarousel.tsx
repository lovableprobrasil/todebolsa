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
    { id: "PROFISSIONALIZANTE", label: "Profissional.", icon: BookOpen },
    { id: "EJA", label: "EJA", icon: GraduationCap },
    { id: "CURSO_LIVRE", label: "Cursos Livres", icon: Sparkles },
    { id: "IDIOMAS", label: "Idiomas", icon: Languages },
    { id: "OUTROS", label: "Mais", icon: Play },
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

  const banners = campaign?.main_banners ?? [];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8">
        {/* Bloco único: banner de campanha + caixa de busca embutida */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-blue">
          {/* Banner rotativo */}
          <div className="relative h-[240px] md:h-[300px]">
            {activeBanner?.image_desktop ? (
              <img
                key={activeBanner.id}
                src={activeBanner.image_desktop}
                alt={activeBanner.alt_text || activeBanner.title || ""}
                className="h-full w-full object-cover transition-opacity duration-500"
                style={{ objectPosition: (activeBanner.theme as any)?.focalPoint || "center" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=1600";
                }}
              />
            ) : isLoading ? (
              <div className="h-full w-full animate-pulse bg-brand-blue/60" />
            ) : (
              <div className="h-full w-full bg-[image:var(--gradient-hero)]" />
            )}

            {activeBanner && (
              <>
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-brand-ink/90 via-brand-ink/60 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex max-w-[62%] flex-col justify-center gap-2 px-6 sm:px-10 md:max-w-[55%]">
                  {activeBanner.badge && (
                    <span className="w-fit rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                      {activeBanner.badge}
                    </span>
                  )}
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
                    {activeBanner.title}
                  </h2>
                  {activeBanner.description && (
                    <p className="hidden max-w-md text-sm text-white/85 sm:block">{activeBanner.description}</p>
                  )}
                  {activeBanner.cta_label && (
                    <span className="mt-1 w-fit rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                      {activeBanner.cta_label}
                    </span>
                  )}
                </div>
                <Link
                  to={activeBanner.cta_url || "/bolsas"}
                  className="absolute inset-0 z-20"
                  aria-label={activeBanner.title}
                />
              </>
            )}


            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  aria-label="Banner anterior"
                  className="absolute left-4 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:flex"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Próximo banner"
                  className="absolute right-4 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:flex"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      aria-label={`Ir para o banner ${i + 1}`}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        currentSlide === i ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Caixa de busca embutida no banner */}
          <div className="p-3 sm:p-5">
            <div className="overflow-hidden rounded-lg bg-card">
              <div role="tablist" className="no-scrollbar flex overflow-x-auto bg-brand-ink">
                {levels.map((l) => {
                  const active = activeLevel === l.id;
                  return (
                    <button
                      key={l.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleLevelChange(l.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 py-4 text-[13px] font-bold transition-colors lg:text-[14px]",
                        active
                          ? "bg-card text-primary"
                          : "text-white/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <l.icon className="h-4 w-4 shrink-0" />
                      {l.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 md:p-6">
                <SearchBar activeLevel={activeLevel} />
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <div className="mx-auto max-w-[1240px] px-4 pb-2 pt-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[2/1] animate-pulse rounded-xl bg-muted" />
          ))
        ) : campaign?.micro_banners && campaign.micro_banners.length > 0 ? (
          campaign.micro_banners.slice(0, 3).map((mb) => (
            <Link
              key={mb.id}
              to={mb.cta_url || "/bolsas"}
              aria-label={mb.alt_text || mb.title || "Ver bolsas"}
              className="group relative aspect-[2/1] overflow-hidden rounded-xl bg-muted transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              {mb.image_desktop ? (
                <img
                  src={mb.image_desktop}
                  alt={mb.alt_text || mb.title || ""}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-ink/5 p-4 text-center">
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-brand-ink">{mb.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{mb.description}</p>
                  </div>
                </div>
              )}
              {mb.image_desktop && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-ink/85 via-brand-ink/45 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center gap-1.5 px-5">
                    {mb.description && (
                      <span className="w-fit rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                        {mb.description}
                      </span>
                    )}
                    <h3 className="font-display text-base font-extrabold leading-snug text-white sm:text-lg">
                      {mb.title}
                    </h3>
                  </div>
                </>
              )}
            </Link>

          ))
        ) : null}
      </div>
    </div>

  );
}
