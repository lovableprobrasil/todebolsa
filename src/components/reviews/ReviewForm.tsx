import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStars } from "./ReviewStars";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

type Existing = { id: string; rating: number; comment: string | null; status: "PENDING" | "APPROVED" | "REJECTED" };

export function ReviewForm({
  reservationId,
  institutionId,
  userId,
}: {
  reservationId: string;
  institutionId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const { data: existing } = useQuery<Existing | null>({
    queryKey: ["my-review", reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_reviews")
        .select("id, rating, comment, status")
        .eq("reservation_id", reservationId)
        .maybeSingle();
      if (error) throw error;
      return (data as Existing | null) ?? null;
    },
  });

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");

  const submit = useMutation({
    mutationFn: async () => {
      if (rating < 1) throw new Error("Selecione de 1 a 5 estrelas.");
      const trimmed = comment.trim().slice(0, 1000);
      if (existing) {
        const { error } = await supabase
          .from("institution_reviews")
          .update({ rating, comment: trimmed || null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("institution_reviews")
          .insert({
            reservation_id: reservationId,
            institution_id: institutionId,
            user_id: userId,
            rating,
            comment: trimmed || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-review", reservationId] });
      toast.success(existing ? "Avaliação atualizada — em moderação." : "Avaliação enviada — em moderação.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // syncs initial values once existing loads
  if (existing && rating === 0 && comment === "" && (existing.rating || existing.comment)) {
    setRating(existing.rating);
    setComment(existing.comment ?? "");
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
        <Star className="h-5 w-5 text-warning fill-warning" /> Como foi sua experiência?
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Sua avaliação ajuda outros alunos. {existing?.status === "APPROVED" && "Sua avaliação está publicada."}
        {existing?.status === "PENDING" && " Sua avaliação está em moderação."}
        {existing?.status === "REJECTED" && " Sua avaliação anterior não foi aprovada — revise e reenvie."}
      </p>

      <div className="mt-5">
        <ReviewStars value={rating} onChange={setRating} size="lg" />
      </div>
      <Textarea
        className="mt-4"
        rows={4}
        placeholder="Conte como foi o atendimento, infraestrutura, qualidade do curso, etc."
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="font-semibold">
          {submit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {existing ? "Atualizar avaliação" : "Enviar avaliação"}
        </Button>
      </div>
    </section>
  );
}
