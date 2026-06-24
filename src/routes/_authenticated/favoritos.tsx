import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, HeartOff, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ScholarshipCard } from "@/components/site/ScholarshipCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listScholarships } from "@/lib/scholarships";

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: FavoritosPage,
});

function FavoritosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: favIds } = useQuery({
    enabled: !!uid,
    queryKey: ["favorites", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("scholarship_id")
        .eq("user_id", uid!);
      return (data ?? []).map((r) => r.scholarship_id);
    },
  });

  const { data: items, isLoading } = useQuery({
    enabled: !!favIds && favIds.length > 0,
    queryKey: ["favorite-scholarships", favIds],
    queryFn: () => listScholarships({ ids: favIds!, limit: 100 }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("favorites").delete().eq("user_id", uid!).eq("scholarship_id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removido dos favoritos");
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary fill-primary" /> Favoritos
        </h1>
        <p className="text-muted-foreground mt-1">Bolsas que você salvou para decidir depois.</p>
      </header>

      {favIds?.length === 0 ? (
        <EmptyState />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[380px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((s) => (
            <div key={s.id} className="relative">
              <button
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => remove.mutate(s.id)}
                aria-label="Remover dos favoritos"
              >
                <HeartOff className="h-4 w-4" />
              </button>
              <ScholarshipCard s={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
        <Heart className="h-7 w-7" />
      </div>
      <h2 className="font-display text-xl font-bold mb-2">Nenhum favorito ainda</h2>
      <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
        Explore o marketplace e clique no coração das bolsas que te interessam.
      </p>
      <Button asChild>
        <Link to="/bolsas">
          <Search className="h-4 w-4 mr-1" /> Buscar bolsas
        </Link>
      </Button>
    </div>
  );
}
