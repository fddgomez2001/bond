import Link from "next/link";
import { ArrowRight, Check, Compass, Handshake, ShieldCheck, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

const pillars = [
  { icon: Compass, title: "Discover", text: "Find events and experiences in one place." },
  { icon: Handshake, title: "Connect", text: "Customers and vendors meet on a shared platform." },
  { icon: ShieldCheck, title: "Trust", text: "Vendors submit business documents for review before approval." },
];

const audiences = [
  {
    id: "customers",
    icon: UserRound,
    title: "For Customers",
    points: ["Discover events and experiences.", "Create an account.", "Access your account securely."],
    cta: { label: "Join as a Customer", href: "/signup/customer" },
    card: "bg-bond-yellow text-bond-ink",
    iconBox: "bg-bond-slate text-white",
    button: "bg-bond-slate text-white hover:bg-[#2c3a3a]",
    note: null,
  },
  {
    id: "vendors",
    icon: Store,
    title: "For Vendors",
    points: [
      "Create a vendor account.",
      "Submit the required registration information.",
      "Access your account after the appropriate verification and approval process.",
    ],
    cta: { label: "Register as a Vendor", href: "/signup/vendor" },
    card: "bg-white text-bond-ink",
    iconBox: "bg-bond-yellow text-bond-slate",
    button: "bg-bond-yellow text-bond-ink hover:bg-bond-gold",
    note: "Vendor accounts are reviewed by the BOND team before vendor tools are enabled.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-bond-night-glow py-16 text-white sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              tone="dark"
              align="left"
              eyebrow="About BOND"
              title="A Better Way to Connect"
              badge="Provisional"
              description="BOND is designed to bring customers, vendors, and event communities together through a simple and accessible digital experience."
            />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-6">
            {pillars.map((pillar, index) => (
              <Reveal as="li" key={pillar.title} delay={index * 110} className="flex">
                <div className="group w-full rounded-3xl border border-white/10 bg-white/5 p-5 transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-bond-yellow/40 hover:bg-white/10">
                  <pillar.icon
                    className="size-6 text-bond-yellow transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6"
                    aria-hidden
                  />
                  <p className="mt-3 font-heading font-semibold">{pillar.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{pillar.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {audiences.map((audience, index) => (
            <Reveal key={audience.id} delay={index * 140} variant="scale" className="flex">
            <article
              id={audience.id}
              className={cn(
                "group flex w-full flex-col rounded-[2rem] p-6 shadow-2xl transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-30px_rgba(240,206,73,0.45)] sm:p-10",
                audience.card,
              )}
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6",
                  audience.iconBox,
                )}
              >
                <audience.icon className="size-7" aria-hidden />
              </span>
              <h3 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{audience.title}</h3>
              <ul className="mt-5 flex-1 space-y-3">
                {audience.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[0.95rem] leading-relaxed text-bond-ink/80">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-bond-slate/10">
                      <Check className="size-3.5 text-bond-slate" aria-hidden />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              {audience.note && <p className="mt-5 text-sm text-bond-ink/60">{audience.note}</p>}
              <Link
                href={audience.cta.href}
                className={cn(
                  "group/cta mt-7 inline-flex h-13 items-center justify-center gap-2 rounded-full px-7 font-display text-lg font-semibold transition-all duration-300 ease-smooth active:scale-[0.98] sm:self-start",
                  audience.button,
                )}
              >
                {audience.cta.label}
                <ArrowRight
                  className="size-5 transition-transform duration-300 ease-smooth group-hover/cta:translate-x-1"
                  aria-hidden
                />
              </Link>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
