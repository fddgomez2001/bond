import { SkeletonTransition } from "@/components/ui/page-transition";

/** Content-area placeholder for admin and vendor pages; the sidebar stays visible around it. */
export function WorkspaceLoading() {
  return (
    <SkeletonTransition>
      <div role="status" aria-live="polite" className="flex flex-1 flex-col">
        <span className="sr-only">Loading…</span>
        <div className="border-b border-bond-ink/8 bg-gradient-to-br from-bond-yellow to-bond-yellow-soft px-4 py-9 sm:px-8 lg:px-10">
          <span className="block h-3 w-20 animate-pulse rounded-full bg-white/50" />
          <span className="mt-3 block h-10 w-72 max-w-full animate-pulse rounded-full bg-white/60" />
          <span className="mt-3 block h-4 w-96 max-w-full animate-pulse rounded-full bg-white/45" />
        </div>
        <div className="grid gap-4 px-4 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl border border-bond-ink/8 bg-white" />
          ))}
        </div>
        <div className="space-y-3 px-4 sm:px-8 lg:px-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-3xl border border-bond-ink/8 bg-white" />
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}
