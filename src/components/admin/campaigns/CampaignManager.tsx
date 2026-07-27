import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Settings2, 
  Image as ImageIcon, 
  ExternalLink, 
  Save, 
  Trash2, 
  ChevronRight,
  Layout,
  LayoutGrid
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CampaignLevel } from "@/lib/homepage/campaigns";

export function CampaignManager() {
  const [activeTab, setActiveTab] = useState<CampaignLevel>("GRADUACAO");
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["admin-campaign", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_campaign_groups")
        .select(`
          *,
          main_banners:homepage_main_banners(*),
          micro_banners:homepage_micro_banners(*)
        `)
        .eq("education_level", activeTab)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...data } = payload;
      const { error } = await supabase
        .from("homepage_campaign_groups")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaign"] });
      toast.success("Campanha atualizada com sucesso!");
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'main' | 'micro' }) => {
      const table = type === 'main' ? 'homepage_main_banners' : 'homepage_micro_banners';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaign"] });
      toast.success("Banner removido!");
    }
  });

  function BannerEditDialog({ banner, type = 'main' }: { banner?: any; type?: 'main' | 'micro' }) {
    const isNew = !banner;
    const [formData, setFormData] = useState(banner || {
      title: "",
      description: "",
      cta_label: "Ver bolsas",
      cta_url: "/bolsas",
      badge: "",
      image_desktop: "",
      image_mobile: "",
      theme: { focalPoint: "center right" },
      status: "ACTIVE",
      display_order: 0,
      group_id: campaign?.id
    });

    const saveMutation = useMutation({
      mutationFn: async (data: any) => {
        const table = type === 'main' ? 'homepage_main_banners' : 'homepage_micro_banners';
        if (isNew) {
          const { error } = await supabase.from(table).insert([data]);
          if (error) throw error;
        } else {
          const { id, created_at, ...updateData } = data;
          const { error } = await supabase.from(table).update(updateData).eq('id', banner.id);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-campaign"] });
        toast.success(isNew ? "Criado com sucesso!" : "Atualizado com sucesso!");
      }
    });

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={isNew ? "outline" : "ghost"} size={isNew ? "default" : "icon"} className={isNew ? "w-full dashed border-2 border-dashed h-12" : ""}>
            {isNew ? <><Plus className="h-4 w-4 mr-2" /> {type === 'main' ? 'Novo Banner Principal' : 'Novo Microbanner'}</> : <Settings2 className="h-4 w-4" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Novo" : "Editar"} {type === 'main' ? "Banner" : "Microbanner"}</DialogTitle>
            <DialogDescription>Configure os detalhes visuais e o destino.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Selo (Badge)</Label>
                <Input value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} placeholder="Ex: Oferta Limitada" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Texto do Botão (CTA)</Label>
                <Input value={formData.cta_label} onChange={e => setFormData({...formData, cta_label: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>URL de Destino</Label>
                <Input value={formData.cta_url} onChange={e => setFormData({...formData, cta_url: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>URL Imagem Desktop (IA ou Link)</Label>
              <div className="flex gap-2">
                <Input value={formData.image_desktop} onChange={e => setFormData({...formData, image_desktop: e.target.value})} placeholder="https://..." />
                <Button variant="secondary" onClick={() => toast.info("Funcionalidade de geração de imagem via IA em breve!")}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Gerar IA
                </Button>
              </div>
            </div>

            {type === 'main' && (
              <div className="grid gap-2">
                <Label>Ponto Focal (CSS object-position)</Label>
                <Input value={formData.theme?.focalPoint} onChange={e => setFormData({...formData, theme: { ...formData.theme, focalPoint: e.target.value }})} placeholder="center right" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const levels: { id: CampaignLevel; label: string }[] = [
    { id: "GRADUACAO", label: "Graduação" },
    { id: "POS_GRADUACAO", label: "Pós-graduação" },
    { id: "TECNICO", label: "Técnico" },
    { id: "ESCOLAS", label: "Escolas" },
    { id: "PROFISSIONALIZANTE", label: "Profissionalizante" },
    { id: "EJA", label: "EJA" },
    { id: "CURSO_LIVRE", label: "Cursos Livres" },
    { id: "IDIOMAS", label: "Idiomas" },
    { id: "OUTROS", label: "Outros" },
  ];

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Campanhas</h2>
          <p className="text-muted-foreground">Administre o conteúdo visual da primeira dobra da home.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CampaignLevel)}>
        <TabsList className="bg-muted p-1 rounded-xl">
          {levels.map(l => (
            <TabsTrigger key={l.id} value={l.id} className="rounded-lg">{l.label}</TabsTrigger>
          ))}
        </TabsList>

        {levels.map(l => (
          <TabsContent key={l.id} value={l.id} className="mt-6 space-y-6">
            {!campaign ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">Esta categoria ainda não possui uma campanha configurada.</p>
                  <Button onClick={() => {
                    // Quick fix: simple insert
                    supabase.from('homepage_campaign_groups').insert({
                      education_level: l.id,
                      title: l.label,
                      status: 'ACTIVE'
                    }).then(() => queryClient.invalidateQueries({ queryKey: ["admin-campaign"] }));
                  }}>
                    Inicializar Campanha
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Main Banner Editor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        Banners Principais
                      </CardTitle>
                      <CardDescription>Máximo de 4 banners ativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {campaign.main_banners?.map((b: any) => (
                        <div key={b.id} className="p-4 rounded-xl border border-border flex items-center justify-between bg-muted/30">
                          <div>
                            <div className="font-bold">{b.title}</div>
                            <div className="text-xs text-muted-foreground">{b.cta_url}</div>
                          </div>
                          <div className="flex gap-2">
                             <BannerEditDialog banner={b} />
                             <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBannerMutation.mutate({ id: b.id, type: 'main' })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                      <BannerEditDialog />
                    </CardContent>
                  </Card>

                  {/* Micro Banner Editor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5" />
                        Microbanners
                      </CardTitle>
                      <CardDescription>Exatamente 3 visíveis no desktop.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {campaign.micro_banners?.map((b: any) => (
                        <div key={b.id} className="p-4 rounded-xl border border-border flex items-center justify-between bg-muted/30">
                          <div>
                            <div className="font-bold">{b.title}</div>
                            <div className="text-xs text-muted-foreground">{b.cta_label}</div>
                          </div>
                          <div className="flex gap-2">
                             <BannerEditDialog banner={b} type="micro" />
                             <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBannerMutation.mutate({ id: b.id, type: 'micro' })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                      <BannerEditDialog type="micro" />
                    </CardContent>
                  </Card>
                </div>

                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações da Busca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label>Título da Aba</Label>
                        <Input 
                          defaultValue={campaign.title} 
                          onBlur={(e) => updateCampaignMutation.mutate({ id: campaign.id, title: e.target.value })}
                        />
                     </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
