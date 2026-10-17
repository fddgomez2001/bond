import { SkeletonTransition } from "@/components/ui/page-transition";

/**
 * Content placeholder under the (always visible) shop header. The yellow
 * band has the same shape and height as the real page heroes (eyebrow,
 * title, text, search/filters), so nothing jumps when the page arrives,
 * and the placeholders are soft tints rather than bright white boxes.
 */
export default function MarketLoading() {
  return (
    <SkeletonTransition>
      <div role="status" aria-live="polite" className="flex flex-1 flex-col">
        <span className="sr-only">Loading…</span>
        <div className="relative overflow-hidden bg-bond-yellow">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-white/25 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 pt-7 pb-10 sm:px-8 sm:pt-10 lg:px-10">
            <span className="block h-3.5 w-32 animate-pulse rounded-full bg-bond-slate/15" />
            <span className="mt-4 block h-11 w-80 max-w-full animate-pulse rounded-2xl bg-bond-slate/15 sm:h-14 sm:w-[26rem]" />
            <span className="mt-4 block h-4 w-[34rem] max-w-full animate-pulse rounded-full bg-bond-slate/10" />
            <span className="mt-2 block h-4 w-[22rem] max-w-full animate-pulse rounded-full bg-bond-slate/10" />
            <span className="mt-6 block h-13 w-full max-w-xl animate-pulse rounded-2xl bg-white/45" />
            <span className="mt-4 flex gap-2">
              {[88, 64, 92, 120].map((w) => (
                <span key={w} className="h-9 animate-pulse rounded-full bg-white/40" style={{ width: w }} />
              ))}
            </span>
          </div>
        </div>
        <div className="mx-auto grid grid-cols-1 w-full max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 sm:px-8 sm:py-10 lg:grid-cols-3 lg:px-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-[26px] bg-bond-ink/[0.045]" />
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}
