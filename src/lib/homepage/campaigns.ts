import { supabase } from "@/integrations/supabase/client";

export type CampaignLevel = 
  | "GRADUACAO" 
  | "POS_GRADUACAO" 
  | "TECNICO" 
  | "ESCOLAS" 
  | "CURSOS_LIVRES" 
  | "IDIOMAS"
  | "EJA"
  | "OUTROS";

export interface HomepageCampaign {
  id: string;
  education_level: string;
  title: string;
  status: string;
  search_configuration: any;
  recommendation_configuration: any;
  main_banners: MainBanner[];
  micro_banners: MicroBanner[];
}

export interface MainBanner {
  id: string;
  title: string;
  description: string;
  badge: string;
  image_desktop: string;
  image_mobile: string;
  alt_text: string;
  cta_label: string;
  cta_url: string;
  target_type: string;
  target_id: string;
  filters: any;
  theme: any;
}

export interface MicroBanner {
  id: string;
  title: string;
  description: string;
  image_desktop: string;
  image_mobile: string;
  alt_text: string;
  cta_label: string;
  cta_url: string;
  target_type: string;
  target_id: string;
  filters: any;
  theme: any;
}

export async function getCampaignByLevel(level: CampaignLevel): Promise<HomepageCampaign | null> {
  const { data: campaign, error } = await supabase
    .from("homepage_campaign_groups")
    .select(`
      *,
      main_banners:homepage_main_banners(*),
      micro_banners:homepage_micro_banners(*)
    `)
    .eq("education_level", level)
    .eq("status", "ACTIVE")
    .order("display_order", { foreignTable: "homepage_main_banners", ascending: true })
    .order("display_order", { foreignTable: "homepage_micro_banners", ascending: true })
    .maybeSingle();

  if (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }

  return campaign as unknown as HomepageCampaign;
}

export async function listActiveCampaigns(): Promise<string[]> {
  const { data, error } = await supabase
    .from("homepage_campaign_groups")
    .select("education_level")
    .eq("status", "ACTIVE")
    .order("priority", { ascending: false });

  if (error) return [];
  return data.map(d => d.education_level);
}
