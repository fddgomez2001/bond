import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Yellow title band at the top of shop and ordering pages. */
export function MarketHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-bond-yellow", className)}>
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-white/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pt-7 pb-10 sm:px-8 sm:pt-10 lg:px-10">
        {eyebrow && <div className="mb-2 text-sm font-semibold text-bond-slate/80">{eyebrow}</div>}
        <h1 className="font-display text-4xl leading-[0.95] tracking-[-0.03em] text-bond-slate sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[0.95rem] text-bond-slate/80 sm:text-base">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

/** Centered page container under the hero. */
export function MarketContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-10 lg:px-10", className)}>{children}</div>;
}
