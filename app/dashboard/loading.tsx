import type { CSSProperties } from "react";
import { Logo } from "@/components/brand/logo";
import { SkeletonTransition, siteHeaderTransition } from "@/components/ui/page-transition";

/**
 * Shown instantly while any dashboard loads, so navigation never flashes a
 * blank page. It mirrors the dashboard layout (yellow header and banner,
 * cards) and hands over to the real content with a soft fade.
 */
export default function DashboardLoading() {
  return (
    <SkeletonTransition>
      <div className="flex min-h-dvh flex-col bg-bond-paper" role="status" aria-live="polite">
        <span className="sr-only">Loading your dashboard…</span>

        <header style={siteHeaderTransition} className="bg-bond-yellow">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <Logo tone="light" href={null} />
            <div className="hidden gap-7 md:flex">
              {[64, 72, 88, 60].map((w) => (
                <Bar key={w} className="h-3 bg-white/50" style={{ width: w }} />
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/40 py-1 pr-3 pl-1">
              <span className="size-9 animate-pulse rounded-full bg-bond-slate/30" />
              <Bar className="hidden h-3 w-16 bg-bond-slate/20 sm:block" />
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden bg-bond-yellow pb-16">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-24 size-[28rem] rounded-full bg-white/20 blur-3xl" />
          <div className="relative mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 pt-8 sm:px-8 lg:grid-cols-12 lg:items-end lg:px-10 lg:pt-14">
            <div className="space-y-5 lg:col-span-7">
              <Bar className="h-14 w-64 bg-white/60 sm:h-20 sm:w-96" />
              <Bar className="h-5 w-full max-w-xl bg-white/45" />
              <Bar className="h-5 w-4/5 max-w-md bg-white/45" />
              <div className="flex gap-3 pt-3">
                <Bar className="h-14 w-44 rounded-full bg-bond-slate/35" />
                <Bar className="h-14 w-48 rounded-full bg-white/70" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-56 animate-pulse rounded-[2rem] border border-white/60 bg-bond-slate/10" />
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-8 grid grid-cols-1 w-full max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
              <span className="block size-11 animate-pulse rounded-2xl bg-bond-yellow/50" />
              <Bar className="mt-4 h-4 w-32 bg-bond-ink/10" />
              <Bar className="mt-2 h-3 w-44 bg-bond-ink/8" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}

function Bar({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={`block animate-pulse rounded-full ${className ?? ""}`} style={style} />;
}
