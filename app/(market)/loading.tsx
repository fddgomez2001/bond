import { SkeletonTransition } from "@/components/ui/page-transition";

/** Content placeholder under the (always visible) shop header. */
export default function MarketLoading() {
  return (
    <SkeletonTransition>
      <div role="status" aria-live="polite" className="flex-1">
        <span className="sr-only">Loading…</span>
        <div className="bg-bond-yellow">
          <div className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-8 lg:px-10">
            <span className="block h-3 w-24 animate-pulse rounded-full bg-white/50" />
            <span className="mt-4 block h-10 w-80 max-w-full animate-pulse rounded-full bg-white/60" />
            <span className="mt-3 block h-4 w-[28rem] max-w-full animate-pulse rounded-full bg-white/45" />
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-[26px] border border-bond-ink/8 bg-white" />
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}
