import { cn } from "@/lib/utils";

/** Pill eyebrow (the "Plans" / "Contacts" chip in the design) + title + intro. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  badge,
  tone = "light",
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <div className={cn("flex flex-wrap items-center gap-2", align === "center" && "justify-center")}>
        <span
          className={cn(
            "inline-flex rounded-xl border px-5 py-1.5 font-heading text-sm font-medium",
            dark ? "border-white/25 bg-white/5 text-white/80" : "border-bond-slate/20 bg-white text-bond-slate",
          )}
        >
          {eyebrow}
        </span>
        {badge && (
          <span className="inline-flex rounded-full bg-bond-amber/15 px-3 py-1 text-xs font-semibold text-[#9a5a00]">
            {badge}
          </span>
        )}
      </div>
      <h2
        className={cn(
          "mt-5 font-heading text-3xl font-bold tracking-tight sm:text-[2.75rem] sm:leading-tight",
          dark ? "text-white" : "text-bond-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-white/80" : "text-bond-ink/65")}>
          {description}
        </p>
      )}
    </div>
  );
}
