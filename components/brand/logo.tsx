import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import logoLight from "@/public/brand/bond-logo.png";
import logoDark from "@/public/brand/bond-logo-dark.png";

/**
 * BOND wordmark. `light` has white letters (for the yellow and dark
 * backgrounds, with the drop shadow from the design); `dark` has slate
 * letters for white surfaces.
 */
export function Logo({
  tone = "light",
  className,
  href = "/",
  eager,
  transitionTypes,
}: {
  tone?: "light" | "dark";
  className?: string;
  href?: string | null;
  /** Load immediately — for logos at the top of the page. */
  eager?: boolean;
  /** View-transition types for the link (see components/ui/page-transition.tsx). */
  transitionTypes?: string[];
}) {
  const image = (
    <Image
      src={tone === "light" ? logoLight : logoDark}
      alt="BOND"
      loading={eager ? "eager" : undefined}
      className={cn(
        "h-auto w-[120px] sm:w-[133px]",
        tone === "light" && "drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
        className,
      )}
    />
  );

  if (!href) return image;
  return (
    <Link
      href={href}
      transitionTypes={transitionTypes}
      className="inline-flex shrink-0 rounded-lg transition-transform duration-300 ease-smooth hover:scale-[1.03] active:scale-95"
      aria-label="BOND home"
    >
      {image}
    </Link>
  );
}
