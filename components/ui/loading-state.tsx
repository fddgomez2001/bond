import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-bond-slate/70", className)}
    >
      <Spinner className="size-7 text-bond-slate" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Grey placeholder block for skeleton screens. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-bond-slate/10", className)} />;
}

/** Placeholder shown while a form streams in. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: fields }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-12" />
    </div>
  );
}
