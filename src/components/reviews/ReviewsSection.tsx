import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReviewStars } from "./ReviewStars";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquareQuote } from "lucide-react";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string | null; avatar_url: string | null } | null;
};

export function ReviewsSection({
  institutionId,
  ratingAvg,
  ratingCount,
}: {
  institutionId: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const { data: reviews, isLoading } = useQuery<ReviewRow[]>({
    queryKey: ["institution-reviews", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_reviews")
        .select(`id, rating, comment, created_at, profiles:profiles!institution_reviews_user_id_fkey(name, avatar_url)`)
        .eq("institution_id", institutionId)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Avaliações dos alunos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Apenas alunos com matrícula efetivada podem avaliar.
          </p>
        </div>
        {ratingCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
            <div className="text-3xl font-extrabold">{Number(ratingAvg).toFixed(1)}</div>
            <div>
              <ReviewStars value={Number(ratingAvg)} readOnly />
              <div className="text-xs text-muted-foreground">{ratingCount} avaliações</div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <MessageSquareQuote className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Ainda não há avaliações publicadas.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((rv) => (
            <article key={rv.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-blue text-brand-blue-foreground grid place-items-center font-bold">
                  {(rv.profiles?.name ?? "A").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-semibold text-sm">{rv.profiles?.name ?? "Aluno"}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(rv.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <ReviewStars value={rv.rating} readOnly />
                  {rv.comment && <p className="text-sm mt-2 leading-relaxed">{rv.comment}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
