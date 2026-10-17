import Link from "next/link";
import { ArrowRight, Check, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    href: "/signup/customer",
    icon: UserRound,
    title: "Customer",
    description: "Discover events and experiences, and connect with the BOND community.",
    points: ["Personal details", "Email verification", "Ready in a few minutes"],
    cta: "Join as a Customer",
    accent: "bg-bond-yellow text-bond-ink",
  },
  {
    href: "/signup/vendor",
    icon: Store,
    title: "Vendor",
    description: "Offer your services on BOND after a review of your business documents.",
    points: ["Personal details", "Selfie, government ID and proof of business", "Manual document review"],
    cta: "Register as a Vendor",
    accent: "bg-bond-slate text-white",
  },
] as const;

export function RoleSelection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {roles.map((role) => (
        <Link
          key={role.href}
          href={role.href}
          className="group flex flex-col rounded-3xl border border-bond-ink/10 bg-white p-5 shadow-sm transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-bond-slate/30 hover:shadow-[var(--shadow-card-hover)] active:translate-y-0 active:scale-[0.99] sm:p-6"
        >
          <span
            className={cn(
              "mb-5 flex size-12 items-center justify-center rounded-2xl transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6",
              role.accent,
            )}
          >
            <role.icon className="size-6" aria-hidden />
          </span>
          <span className="font-heading text-xl font-bold text-bond-ink">{role.title}</span>
          <span className="mt-2 text-sm leading-relaxed text-bond-ink/65">{role.description}</span>
          <ul className="mt-5 space-y-2 text-sm text-bond-ink/80">
            {role.points.map((point) => (
              <li key={point} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
          <span className="mt-6 inline-flex items-center gap-2 pt-1 font-semibold text-bond-slate">
            {role.cta}
            <ArrowRight className="size-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      ))}
    </div>
  );
}
