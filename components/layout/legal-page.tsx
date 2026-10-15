import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Footer } from "./footer";

/** Shared layout for the placeholder Privacy Policy and Terms pages. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="bg-bond-yellow">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-8">
          <Logo tone="light" />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-bond-slate hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
        </div>
        <div className="mx-auto max-w-4xl px-4 pt-6 pb-14 sm:px-8">
          <h1 className="font-display text-5xl tracking-[-0.03em] text-bond-slate sm:text-6xl">{title}</h1>
          <p className="mt-3 inline-flex rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-bond-slate">
            Placeholder — not legal advice. Replace with your official document before launch.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-14 text-[0.95rem] leading-relaxed text-bond-ink/80 sm:px-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-bond-ink">
        {children}
      </main>
      <Footer />
    </>
  );
}
