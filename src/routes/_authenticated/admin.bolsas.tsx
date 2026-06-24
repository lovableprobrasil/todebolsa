import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GraduationCap, Search, Star, ExternalLink, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bolsas")({
  component: AdminScholarships,
});

function AdminScholarships() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-scholarships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select(`
          id, title, is_active, is_featured, price_with_scholarship, used_count, max_uses, end_at, created_at,
          course_offering:course_offerings(
            course:courses(name, institution:institutions(trade_name, slug))
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const featureMut = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.rpc("toggle_scholarship_feature", { p_scholarship_id: id, p_featured: featured });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-scholarships"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("scholarships").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-scholarships"] }); toast.success("Atualizado."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((s) => {
    if (!q) return true;
    const inst = s.course_offering?.course?.institution?.trade_name ?? "";
    return s.title.toLowerCase().includes(q.toLowerCase()) || inst.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por bolsa ou instituição..." className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const course = s.course_offering?.course;
            const inst = course?.institution;
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{inst?.trade_name}</div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-bold truncate">{course?.name} — {s.title}</h3>
                      {s.is_featured && <Star className="h-4 w-4 text-accent fill-accent" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <Badge className={(s.is_active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground") + " border-0"}>
                        {s.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                      <span>{s.used_count}{s.max_uses ? "/" + s.max_uses : ""} usos</span>
                      {s.end_at && <span>Encerra {new Date(s.end_at).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-lg font-extrabold text-primary">{formatBRL(Number(s.price_with_scholarship))}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => featureMut.mutate({ id: s.id, featured: !s.is_featured })}>
                    <Star className={"h-4 w-4 mr-1 " + (s.is_featured ? "fill-accent text-accent" : "")} />
                    {s.is_featured ? "Despromover" : "Destacar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive.mutate({ id: s.id, active: !s.is_active })}>
                    <Power className="h-4 w-4 mr-1" /> {s.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  {inst && (
                    <a href={"/instituicoes/" + inst.slug} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-primary hover:underline inline-flex items-center gap-1">
                      Página da instituição <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Nenhuma bolsa encontrada.</div>
          )}
        </div>
      )}
    </div>
  );
}
