import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Split-card layout shared by every auth screen: a slate panel (title,
 * stepper) beside a white form area, on the BOND yellow background.
 *
 *  - phones: compact panel stacked above the form, minimal padding;
 *  - tablets: single centred column at a readable width;
 *  - desktops: panel and form side by side, vertically centred.
 *
 * Purely presentational, so both Server and Client Components can use it.
 */
export function AuthShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bond-yellow">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-white/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-bond-gold/40 blur-3xl" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Logo tone="light" eager />
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-bond-slate transition-colors duration-300 hover:bg-white/30"
        >
          <ArrowLeft
            className="size-4 transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5"
            aria-hidden
          />
          <span className="sm:hidden">Home</span>
          <span className="hidden sm:inline">Back to home</span>
        </Link>
      </header>

      {/* items-* stops the card from stretching to the full screen height. */}
      <main className="relative flex w-full flex-1 items-start px-3 pb-6 sm:items-center sm:px-6 sm:pb-10">
        <div className="mx-auto grid w-full max-w-xl animate-fade-up gap-2 rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(56,73,73,0.55)] sm:gap-3 sm:rounded-[28px] sm:p-3 lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
          <aside className="relative isolate overflow-hidden rounded-[18px] bg-bond-slate px-5 py-6 text-white sm:rounded-[22px] sm:px-8 sm:py-8 lg:min-h-[600px] lg:px-10 lg:py-10">
            {aside}
            <AsideDecoration />
          </aside>
          <section className="px-3 py-5 sm:px-6 sm:py-8 lg:px-12 lg:py-12">{children}</section>
        </div>
      </main>
    </div>
  );
}

function AsideDecoration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-56 w-full lg:block"
    >
      <path d="M0 120 C 90 40, 150 210, 260 150 S 400 90, 400 90 V260 H0Z" fill="#4a696f" opacity="0.7" />
      <circle cx="40" cy="220" r="78" fill="#f0ce49" />
      <path d="M170 260 C 210 160, 300 150, 340 170 S 400 230, 400 230 V260Z" fill="#ff9f00" opacity="0.9" />
      <g stroke="#ffffff" strokeWidth="7" strokeLinecap="round">
        <path d="M250 70 l-14 16" />
        <path d="M276 80 l16 12" />
        <path d="M258 108 l-8 18" />
      </g>
    </svg>
  );
}

/** Heading block for the slate panel. The description hides on phones to save space. */
export function AuthAsideIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {eyebrow && (
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-bond-yellow uppercase sm:text-xs">{eyebrow}</p>
      )}
      <h1 className="font-display text-2xl leading-tight font-semibold sm:text-3xl lg:text-4xl">{title}</h1>
      {children && (
        <div className="hidden max-w-sm text-[0.95rem] leading-relaxed text-white/80 sm:block">{children}</div>
      )}
    </div>
  );
}

/** Title + subtitle at the top of the white form area. */
export function AuthFormHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-6 space-y-1.5 sm:mb-7 sm:space-y-2">
      <h2 className="font-heading text-[1.6rem] leading-tight font-bold text-bond-ink sm:text-3xl">{title}</h2>
      {description && <p className="text-[0.95rem] text-bond-ink/65">{description}</p>}
    </div>
  );
}
