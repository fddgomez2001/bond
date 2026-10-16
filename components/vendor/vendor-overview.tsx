import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ExternalLink,
  PackagePlus,
  PartyPopper,
  Receipt,
  ShoppingBag,
  Star,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { RatingStars } from "@/components/marketplace/bits";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { formatPeso } from "@/lib/format";
import type { getVendorStats } from "@/lib/marketplace/vendor-data";
import { cn } from "@/lib/utils";

type Stats = Awaited<ReturnType<typeof getVendorStats>>;

/** Approved vendor home: setup checklist, today's numbers and shortcuts. */
export function VendorOverview({ firstName, stats }: { firstName: string | null; stats: Stats }) {
  const { shop } = stats;
  const totalListings = stats.approvedListings + stats.pendingListings + stats.rejectedListings;
  const setup = [
    { label: "Set up your shop", hint: "Name, logo, city and delivery fee.", done: Boolean(shop), href: "/dashboard/vendor/shop" },
    {
      label: "Add a product or service",
      hint: "Gifts, surprises or event services.",
      done: totalListings > 0,
      href: "/dashboard/vendor/products/new",
    },
    {
      label: "Get approved by BOND",
      hint: "An admin checks each listing before customers see it.",
      done: stats.approvedListings > 0,
      href: "/dashboard/vendor/products",
    },
    {
      label: "Receive your first order",
      hint: "Customers pay first; BOND holds it until they confirm.",
      done: stats.activeOrders + stats.completedOrders > 0,
      href: "/dashboard/vendor/orders",
    },
  ];
  const doneCount = setup.filter((s) => s.done).length;
  const nextStep = setup.find((s) => !s.done);

  const cards: { label: string; value: string; hint: string; icon: LucideIcon; href: string; accent?: boolean }[] = [
    {
      label: "Needs your action",
      value: String(stats.needsAction),
      hint: stats.needsAction ? "Orders waiting for you" : "All caught up",
      icon: Receipt,
      href: "/dashboard/vendor/orders",
      accent: stats.needsAction > 0,
    },
    {
      label: "Live listings",
      value: String(stats.approvedListings),
      hint: stats.pendingListings ? `${stats.pendingListings} waiting for approval` : "Visible to customers",
      icon: ShoppingBag,
      href: "/dashboard/vendor/products",
    },
    {
      label: "Held by BOND",
      value: formatPeso(stats.held),
      hint: "Released when customers confirm",
      icon: Wallet,
      href: "/dashboard/vendor/sales",
    },
    {
      label: "Released to you",
      value: formatPeso(stats.released),
      hint: `${stats.completedOrders} completed order${stats.completedOrders === 1 ? "" : "s"}`,
      icon: BarChart3,
      href: "/dashboard/vendor/sales",
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Vendor · Overview"
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        description={shop ? `Here's how ${shop.name} is doing today.` : "Your account is verified. Let's open your shop."}
        actions={
          shop ? (
            <Link
              href={`/shops/${shop.slug}`}
              transitionTypes={["nav-forward"]}
              className={buttonClasses({ variant: "primary", className: "group" })}
            >
              <Store className="size-4" aria-hidden />
              View my shop
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </Link>
          ) : null
        }
      />

      <WorkspaceContent>
        {stats.rejectedListings > 0 && (
          <Alert tone="warning" title="Some listings need changes" className="mb-6">
            {stats.rejectedListings} listing{stats.rejectedListings === 1 ? " was" : "s were"} not approved. Open{" "}
            <Link href="/dashboard/vendor/products" className="font-semibold underline">
              Products
            </Link>{" "}
            or{" "}
            <Link href="/dashboard/vendor/services" className="font-semibold underline">
              Services
            </Link>{" "}
            to read the reviewer&apos;s notes and resubmit.
          </Alert>
        )}

        {doneCount < setup.length && (
          <Reveal>
            <section className="mb-6 overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bond-ink/8 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-heading text-lg font-bold text-bond-ink">Get your shop ready</h2>
                  <p className="text-sm text-bond-ink/60">
                    {doneCount} of {setup.length} done
                  </p>
                </div>
                {nextStep && (
                  <Link href={nextStep.href} className={buttonClasses({ variant: "gold", size: "sm", className: "group" })}>
                    {nextStep.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                )}
              </div>
              <div className="h-1.5 bg-bond-ink/5" aria-hidden>
                <div
                  className="h-full rounded-r-full bg-bond-amber transition-[width] duration-700 ease-smooth"
                  style={{ width: `${(doneCount / setup.length) * 100}%` }}
                />
              </div>
              <ol className="grid gap-px bg-bond-ink/8 sm:grid-cols-2 lg:grid-cols-4">
                {setup.map((step, index) => (
                  <li key={step.label} className="bg-white">
                    <Link href={step.href} className="group flex h-full gap-3 p-5 transition-colors hover:bg-bond-paper">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          step.done ? "bg-bond-slate text-white" : step === nextStep ? "bg-bond-yellow text-bond-ink" : "bg-bond-ink/8 text-bond-ink/45",
                        )}
                      >
                        {step.done ? <Check className="size-4" aria-hidden /> : index + 1}
                      </span>
                      <span>
                        <span className={cn("block text-sm font-semibold", step.done ? "text-bond-ink/55 line-through" : "text-bond-ink")}>
                          {step.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-bond-ink/55">{step.hint}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>
        )}

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {cards.map((card, index) => (
            <Reveal as="li" key={card.label} delay={index * 70} className="flex">
              <Link
                href={card.href}
                className={cn(
                  "group flex w-full flex-col rounded-3xl border p-4 transition-all duration-500 ease-smooth hover:-translate-y-1 sm:p-5",
                  card.accent
                    ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card-hover)]"
                    : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs font-semibold sm:text-sm", card.accent ? "text-white/80" : "text-bond-ink/60")}>
                    {card.label}
                  </span>
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6",
                      card.accent ? "bg-bond-yellow text-bond-ink" : "bg-bond-yellow/40 text-bond-slate",
                    )}
                  >
                    <card.icon className="size-[18px]" aria-hidden />
                  </span>
                </span>
                <span className="mt-3 truncate font-heading text-2xl font-bold sm:text-3xl">{card.value}</span>
                <span className={cn("mt-1 text-xs", card.accent ? "text-white/70" : "text-bond-ink/55")}>{card.hint}</span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="lg:col-span-2">
            <section className="h-full rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="font-heading text-base font-bold text-bond-ink">Quick actions</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { href: "/dashboard/vendor/products/new?kind=gift", icon: PackagePlus, label: "Add a gift product" },
                  { href: "/dashboard/vendor/products/new?kind=surprise", icon: PartyPopper, label: "Add a surprise" },
                  { href: "/dashboard/vendor/services/new", icon: Store, label: "Add an event service or package" },
                  { href: "/dashboard/vendor/orders", icon: Receipt, label: "Manage orders" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-bond-ink/8 bg-bond-paper px-4 py-3 text-sm font-medium text-bond-ink transition-all duration-300 ease-smooth hover:border-bond-slate/25 hover:bg-bond-cream"
                    >
                      <item.icon className="size-5 text-bond-slate" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight className="size-4 text-bond-ink/40 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={140}>
            <Link
              href="/dashboard/vendor/reviews"
              className="group flex h-full flex-col rounded-3xl bg-bond-slate p-5 text-white shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1 sm:p-6"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white/75">
                <Star className="size-4 text-bond-yellow" aria-hidden /> Customer rating
              </span>
              <span className="mt-3 font-heading text-4xl font-bold">{stats.rating ? stats.rating.toFixed(1) : "—"}</span>
              <span className="mt-2 [&_span]:text-white/80">
                <RatingStars rating={stats.rating} count={stats.reviewCount} />
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-bond-yellow">
                Read reviews
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </Reveal>
        </div>
      </WorkspaceContent>
    </main>
  );
}
