import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-bond-yellow px-4 text-center">
      <Logo tone="light" />
      <p className="font-display text-[7rem] leading-none tracking-[-0.05em] text-white [text-shadow:0_2px_8px_rgba(56,73,73,0.25)] sm:text-[10rem]">
        4<span className="text-bond-slate">0</span>4
      </p>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-bond-slate">This page wandered off</h1>
        <p className="text-bond-slate/75">The link may be broken, or the page may have moved.</p>
      </div>
      <Link href="/" className={buttonClasses({ size: "lg", className: "rounded-full px-8" })}>
        Back to home
      </Link>
    </main>
  );
}
