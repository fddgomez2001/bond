import type { ReactNode } from "react";
import Image from "next/image";
import { CalendarHeart, Gift, PartyPopper, Star } from "lucide-react";
import { formatPeso } from "@/lib/format";
import { kindMeta, orderStatusLabel, statusTone, type ListingKind, type OrderStatus } from "@/lib/marketplace/constants";
import { mediaUrl } from "@/lib/marketplace/media";
import { cn } from "@/lib/utils";

export function Price({ amount, className }: { amount: number | string; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatPeso(Number(amount))}</span>;
}

const kindArt: Record<ListingKind, { icon: typeof Gift; gradient: string }> = {
  gift: { icon: Gift, gradient: "from-bond-yellow via-bond-gold to-bond-amber" },
  surprise: { icon: PartyPopper, gradient: "from-[#ffd36b] via-[#ff9f00] to-[#e86a3a]" },
  service: { icon: CalendarHeart, gradient: "from-bond-slate via-bond-slate-light to-[#7fa3a8]" },
};

/** Listing photo, or a branded placeholder when the vendor hasn't added one. */
export function ListingImage({
  path,
  kind,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  preload,
}: {
  path: string | null;
  kind: ListingKind;
  alt: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  const url = mediaUrl(path);
  const art = kindArt[kind];
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", art.gradient, className)}>
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <span aria-hidden className="absolute -right-6 -bottom-8 size-32 rounded-full bg-white/15" />
          <art.icon aria-hidden className="relative size-12 text-white drop-shadow" />
        </div>
      )}
    </div>
  );
}

export function KindBadge({ kind, className }: { kind: ListingKind; className?: string }) {
  return (
    <span className={cn("rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-bold text-bond-slate shadow-sm", className)}>
      {kindMeta[kind].label}
    </span>
  );
}

export function RatingStars({ rating, count, size = "sm" }: { rating: number | null; count?: number; size?: "sm" | "md" }) {
  if (rating === null) return <span className="text-xs text-bond-ink/45">No reviews yet</span>;
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(size === "md" ? "size-5" : "size-3.5", n <= rounded ? "fill-bond-gold text-bond-gold" : "text-bond-ink/20")}
          />
        ))}
      </span>
      <span className={cn("font-semibold text-bond-ink", size === "md" ? "text-base" : "text-xs")}>{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-bond-ink/50">({count})</span>}
    </span>
  );
}

export function OrderStatusBadge({ status, kind, className }: { status: OrderStatus; kind: ListingKind; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap", statusTone[status], className)}>
      {orderStatusLabel(status, kind)}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: typeof Gift;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-bond-ink/15 bg-white px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-bond-yellow/40 text-bond-slate">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="font-heading text-lg font-semibold text-bond-ink">{title}</p>
      {children && <div className="max-w-md text-sm text-bond-ink/60">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Horizontal step indicator for the order flows. */
export function WizardSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress" className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol className="flex w-max min-w-full items-center gap-2">
        {steps.map((label, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                  state === "current" && "bg-bond-slate text-white",
                  state === "done" && "bg-bond-yellow text-bond-ink",
                  state === "upcoming" && "bg-bond-ink/8 text-bond-ink/45",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  state === "current" ? "font-semibold text-bond-ink" : "text-bond-ink/55",
                )}
              >
                {label}
              </span>
              {index < steps.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-bond-ink/15 sm:w-10" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
