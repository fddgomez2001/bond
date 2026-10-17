import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { teamPlaceholders } from "@/lib/data/home-content";
import { cn } from "@/lib/utils";
import { HeroMascot } from "./hero-mascot";

/** Stagger for the one-time hero entrance (see .hero-enter in globals.css). */
const delay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-bond-yellow pt-24 sm:pt-28 lg:flex lg:min-h-[min(100svh,64rem)] lg:items-stretch lg:pt-28"
    >
      <div aria-hidden className="pointer-events-none absolute -top-32 right-[-15%] -z-10 size-[42rem] rounded-full bg-white/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-20%] left-[-10%] -z-10 size-[30rem] rounded-full bg-bond-gold/30 blur-3xl" />

      <div className="mx-auto grid grid-cols-1 w-full max-w-7xl px-4 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-4 lg:px-10 2xl:max-w-[86rem]">
        {/* Copy */}
        <div className="flex flex-col justify-center pb-4 lg:pb-20">
          <p
            className="hero-enter inline-flex items-center gap-2 self-start rounded-full border border-white/60 bg-white/25 px-4 py-1.5 text-xs font-medium text-bond-slate sm:text-sm"
            style={delay(0)}
          >
            <span className="size-2 rounded-full bg-bond-slate" aria-hidden />
            Bring people together with BOND
          </p>

          <h1
            className="hero-enter mt-5 font-display text-[clamp(3.4rem,16.5vw,6.5rem)] leading-[0.8] font-normal tracking-[-0.05em] text-white [text-shadow:0_2px_8px_rgba(56,73,73,0.25)] sm:mt-6 lg:text-[6.5rem] xl:text-[8.75rem]"
            style={delay(80)}
          >
            why <span className="text-bond-slate">bond?</span>
          </h1>

          <p
            className="hero-enter mt-6 max-w-[43rem] font-display text-lg leading-snug tracking-[0.04em] text-white [text-shadow:0_1px_3px_rgba(56,73,73,0.45)] sm:mt-8 sm:text-2xl lg:text-[1.7rem] lg:leading-[1.1] xl:text-[1.95rem]"
            style={delay(160)}
          >
            With us, we do not just sell services — we create memories that last a lifetime.
          </p>

          <div className="hero-enter mt-8 flex flex-col gap-3 min-[420px]:flex-row sm:mt-10 sm:gap-4" style={delay(240)}>
            <Link
              href="#events"
              className="inline-flex h-14 items-center justify-center rounded-full bg-bond-slate px-8 font-display text-lg font-bold text-white shadow-lg transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] sm:h-16 sm:px-9 sm:text-xl xl:h-[70px] xl:text-[1.6rem]"
            >
              Explore Events
            </Link>
            <Link
              href="/signup"
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 font-display text-lg text-bond-slate shadow-lg transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] sm:h-16 sm:px-9 sm:text-xl xl:h-[70px] xl:text-[1.6rem]"
            >
              Be Part of Bond
              <ArrowRight
                className="size-5 transition-transform duration-300 ease-smooth group-hover:translate-x-1 sm:size-6"
                aria-hidden
              />
            </Link>
          </div>

          <TeamPill />
        </div>

        {/* Mascot — stands on the bottom edge of the hero */}
        <div className="relative mt-6 flex items-end justify-center lg:mt-0 lg:justify-end">
          <div
            aria-hidden
            className="absolute bottom-[8%] left-1/2 -z-10 aspect-square w-[78%] max-w-[34rem] -translate-x-1/2 rounded-full bg-white/35 blur-2xl lg:left-auto lg:right-[4%] lg:translate-x-0"
          />
          <div className="hero-mascot-enter w-[min(84vw,24rem)] sm:w-[26rem] md:w-[28rem] lg:w-full lg:max-w-[36rem] 2xl:max-w-[40rem]">
            <div className="hero-mascot-float">
              <HeroMascot />
            </div>
          </div>
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 h-4 w-[45%] max-w-60 -translate-x-1/2 rounded-[50%] bg-bond-slate/25 blur-md lg:left-auto lg:right-[22%] lg:translate-x-0"
          />
        </div>
      </div>
    </section>
  );
}

function TeamPill() {
  return (
    <div
      className="hero-enter mt-10 flex max-w-[49rem] flex-col gap-4 rounded-[2rem] border border-white/80 bg-bond-slate/20 p-4 min-[420px]:flex-row min-[420px]:items-center sm:mt-12 sm:gap-5 sm:rounded-full sm:py-4 sm:pr-10 sm:pl-4 lg:mt-10 lg:pr-8 xl:mt-12 xl:pr-10"
      style={delay(320)}
    >
      <ul className="flex shrink-0 -space-x-3" aria-label="Team members (photos coming soon)">
        {teamPlaceholders.map((member, index) => (
          <li
            key={index}
            className={cn(
              "flex size-14 items-center justify-center rounded-full border-[3px] border-bond-gold font-display text-lg font-semibold shadow-[var(--shadow-avatar)] transition-transform duration-300 ease-spring hover:z-10 hover:-translate-y-1 hover:scale-110 sm:size-[5.5rem] sm:text-2xl lg:size-16 lg:text-xl xl:size-[6.5rem] xl:text-3xl",
              member.tone,
            )}
          >
            <span aria-hidden>{member.initials}</span>
          </li>
        ))}
      </ul>
      <div>
        <p className="font-display text-xl font-bold whitespace-nowrap text-white [text-shadow:0_1px_3px_rgba(56,73,73,0.4)] sm:text-[2rem] lg:text-2xl xl:text-[2rem]">
          Our Team
        </p>
        <p className="mt-1 max-w-xs font-display text-sm leading-snug text-white [text-shadow:0_1px_2px_rgba(56,73,73,0.45)] sm:text-[0.95rem]">
          The people behind BOND — profiles and photos are coming soon.
        </p>
      </div>
    </div>
  );
}
