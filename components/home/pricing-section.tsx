import Link from "next/link";
import { Check } from "lucide-react";
import { plans } from "@/lib/data/home-content";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function PricingSection() {
  return (
    <section id="pricing" className="bg-bond-cream py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <Reveal>
        <SectionHeading
          eyebrow="Plans"
          title="Pricing"
          badge="Sample plans"
          description="A preview of how BOND plans could look. Final pricing and plan features will be announced before launch."
        />
        </Reveal>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-5 sm:mt-14 sm:gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <Reveal as="li" key={plan.name} delay={index * 140} variant="scale" className="flex">
            <div
              className={cn(
                "group relative flex w-full flex-col overflow-hidden rounded-[28px] border p-6 text-white shadow-2xl transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:border-bond-yellow/40 sm:p-8",
                "border-white/10 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(148,112,21,0.55)_0%,#0b0b0b_55%)]",
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-24 size-56 rounded-full bg-bond-yellow/0 blur-3xl transition-colors duration-700 group-hover:bg-bond-yellow/20"
              />
              {plan.highlighted && (
                <span className="absolute top-6 right-6 rounded-full bg-bond-yellow px-3 py-1 text-xs font-bold text-bond-ink">
                  Coming soon
                </span>
              )}
              <p className="text-sm font-medium text-white/80">{plan.name}</p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold">
                  {plan.price === null ? "TBA" : formatPeso(plan.price)}
                </span>
                {plan.price !== null && plan.period && <span className="text-sm text-white/60">{plan.period}</span>}
              </p>

              {plan.cta ? (
                <Link
                  href={plan.cta.href}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#d9d9d9] text-sm font-semibold text-bond-ink transition-all duration-300 ease-smooth hover:bg-white active:scale-[0.98]"
                >
                  {plan.cta.label}
                </Link>
              ) : (
                <span
                  className="mt-6 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white/60"
                >
                  Pricing to be announced
                </span>
              )}

              <ul className="mt-7 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-white/85">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-white/15">
                      <Check className="size-3 text-bond-yellow" aria-hidden />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
