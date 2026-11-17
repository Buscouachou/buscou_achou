import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg, fmtDate, useMe } from "@/lib/hooks";
import type { Review, ReviewIn } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Stars({ value, onChange, size = 4 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn("transition-transform", onChange && "hover:scale-110 cursor-pointer")}
          data-testid={onChange ? `review-star-${n}` : undefined}
        >
          <Star className={cn(n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300")} style={{ width: size * 4, height: size * 4 }} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews({ businessId }: { businessId: string }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: reviews = [], isError } = useQuery({
    queryKey: ["reviews", businessId],
    queryFn: () => apiGet<Review[]>(`/businesses/${businessId}/reviews`),
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const m = useMutation({
    mutationFn: (body: ReviewIn) => apiPost<Review>(`/businesses/${businessId}/reviews`, body),
    onSuccess: () => {
      toast.success("Avaliação publicada!");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", businessId] });
      qc.invalidateQueries({ queryKey: ["business", businessId] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-6" data-testid="store-reviews">
      {me && (me.role === "customer" || me.role === "admin") ? (
        <form
          className="rounded-2xl border bg-card p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate({ rating, comment });
          }}
        >
          <p className="font-semibold">Avalie esta empresa</p>
          <Stars value={rating} onChange={setRating} size={6} />
          <Textarea placeholder="Conte como foi sua experiência..." value={comment} onChange={(e) => setComment(e.target.value)} data-testid="review-comment-input" />
          <Button type="submit" disabled={m.isPending} data-testid="review-submit-button">Publicar avaliação</Button>
        </form>
      ) : !me ? (
        <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground" data-testid="review-login-prompt">
          <Link to="/sign-in" className="font-semibold text-brand underline" data-testid="review-login-link">Entre com sua conta Google</Link> para avaliar esta empresa.
        </p>
      ) : null}
      {isError && <p className="text-sm text-muted-foreground">Não foi possível carregar as avaliações.</p>}
      {!isError && reviews.length === 0 && <p className="text-sm text-muted-foreground" data-testid="reviews-empty">Ainda não há avaliações.</p>}
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border bg-card p-4" data-testid={`review-item-${r.id}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{r.user_name}</span>
              <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
            </div>
            <div className="mt-1"><Stars value={r.rating} /></div>
            {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
