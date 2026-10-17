import { MessageSquareHeart, Star } from "lucide-react";
import { EmptyState, RatingStars } from "@/components/marketplace/bits";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { formatDateTime } from "@/lib/format";
import type { Review } from "@/types/marketplace";

/** Vendor Reviews: average rating, the spread of stars, and every comment. */
export function ReviewsView({ reviews }: { reviews: Review[] }) {
  const average = reviews.length ? reviews.reduce((t, r) => t + r.rating, 0) / reviews.length : null;
  const spread = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Vendor · Reviews"
        title="Reviews"
        description="Customers can rate an order after they confirm they received it. Reviews appear on your public shop page."
      />
      <WorkspaceContent>
        {reviews.length === 0 ? (
          <EmptyState icon={MessageSquareHeart} title="No reviews yet">
            When customers confirm an order, they&apos;re asked how it went. Their ratings will show up here.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Reveal>
              <section className="rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)] lg:sticky lg:top-6">
                <p className="text-sm font-semibold text-white/75">Average rating</p>
                <p className="mt-2 font-heading text-5xl font-bold">{average?.toFixed(1)}</p>
                <div className="mt-2 [&_span]:text-white/85">
                  <RatingStars rating={average} count={reviews.length} size="md" />
                </div>
                <ul className="mt-6 space-y-2">
                  {spread.map((row) => (
                    <li key={row.stars} className="flex items-center gap-3 text-sm">
                      <span className="inline-flex w-8 items-center gap-0.5">
                        {row.stars}
                        <Star className="size-3.5 fill-bond-yellow text-bond-yellow" aria-hidden />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
                        <span
                          className="block h-full rounded-full bg-bond-yellow"
                          style={{ width: `${(row.count / reviews.length) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-white/70">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
            <ul className="space-y-3 lg:col-span-2">
              {reviews.map((review, index) => (
                <Reveal as="li" key={review.id} delay={Math.min(index, 6) * 50}>
                  <article className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-bond-ink">{review.reviewer_name}</p>
                      <RatingStars rating={review.rating} />
                    </div>
                    {review.comment && <p className="mt-2 text-sm whitespace-pre-line text-bond-ink/80">{review.comment}</p>}
                    <p className="mt-2 text-xs text-bond-ink/50">{formatDateTime(review.created_at)}</p>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </WorkspaceContent>
    </main>
  );
}
