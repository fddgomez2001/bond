import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarHeart, Gift, KeyRound, PartyPopper, Receipt, Store, type LucideIcon } from "lucide-react";
import { AppHeader, MarketFooter } from "@/components/marketplace/app-header";
import { EmptyState, KindBadge, OrderStatusBadge } from "@/components/marketplace/bits";
import { ShopCard } from "@/components/marketplace/cards";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { formatDateOnly, formatDateTime, formatMonthYear } from "@/lib/format";
import type { ShopSummary } from "@/lib/marketplace/catalog";
import { eventTypeLabel } from "@/lib/marketplace/constants";
import type { BookingSummary, OrderSummary } from "@/lib/marketplace/customer-data";
import type { Profile } from "@/types/database";

const entryPoints: { href: string; icon: LucideIcon; title: string; text: string; tone: string }[] = [
  {
    href: "/order/gift",
    icon: Gift,
    title: "Send a gift",
    text: "Choose a store, fill your cart and we'll deliver it to someone you love.",
    tone: "from-bond-yellow to-bond-gold",
  },
  {
    href: "/order/surprise",
    icon: PartyPopper,
    title: "Plan a surprise",
    text: "Pick the date, time and surprise. The shop handles the rest — right on time.",
    tone: "from-[#ffd36b] to-bond-amber",
  },
  {
    href: "/order/event",
    icon: CalendarHeart,
    title: "Book event services",
    text: "Corporate, social or cultural events — a ready package or your own checklist.",
    tone: "from-[#a9c4c7] to-bond-slate-light",
  },
];

type Recent = { id: string; href: string; title: string; subtitle: string; badge: ReactNode };

/** Customer home after sign-up / login: start an order, track recent ones, discover shops. */
export function CustomerHome({
  profile,
  email,
  emailConfirmed,
  justVerified,
  orders,
  bookings,
  shops,
}: {
  profile: Profile;
  email: string | null;
  emailConfirmed: boolean;
  justVerified: boolean;
  orders: OrderSummary[];
  bookings: BookingSummary[];
  shops: ShopSummary[];
}) {
  const firstName = profile.first_name ?? "there";
  const recent: (Recent & { at: string })[] = [
    ...orders.map((o) => ({
      id: o.id,
      at: o.created_at,
      href: `/orders/${o.id}`,
      title: o.items[0]?.title ?? o.order_number,
      subtitle: `${o.shop?.name ?? ""} · ${formatDateTime(o.created_at)}`,
      badge: <OrderStatusBadge status={o.status} kind={o.kind} />,
    })),
    ...bookings.map((b) => ({
      id: b.id,
      at: b.created_at,
      href: `/bookings/${b.id}`,
      title: `${eventTypeLabel(b.event_type)} · ${b.booking_number}`,
      subtitle: `${formatDateTime(b.event_at)} · ${b.place}`,
      badge: <KindBadge kind="service" className="bg-bond-yellow/40! shadow-none!" />,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);

  return (
    <div className="flex min-h-dvh flex-col bg-bond-paper">
      <AppHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-bond-yellow pb-24">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-24 size-[28rem] rounded-full bg-white/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-8 lg:px-10 lg:pt-14">
            {justVerified && (
              <Alert tone="success" title="You're all set!" className="mb-6 max-w-xl">
                Your email is verified and your BOND account is ready.
              </Alert>
            )}
            <h1 className="font-display text-5xl leading-[0.9] tracking-[-0.04em] text-white [text-shadow:0_2px_8px_rgba(56,73,73,0.25)] sm:text-7xl">
              hello, <span className="text-bond-slate">{firstName.toLowerCase()}!</span>
            </h1>
            <p className="mt-5 max-w-xl font-display text-xl leading-snug tracking-[0.03em] text-white [text-shadow:0_1px_3px_rgba(56,73,73,0.45)] sm:text-2xl">
              What would you like to do today?
            </p>
          </div>
        </section>

        {/* Order entry points: the three branches of the order flow */}
        <section aria-labelledby="start-heading" className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 id="start-heading" className="sr-only">
            Start an order
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {entryPoints.map((entry, index) => (
              <Reveal as="li" key={entry.href} delay={index * 90} className="flex">
                <Link
                  href={entry.href}
                  transitionTypes={["nav-forward"]}
                  className="group flex w-full flex-col overflow-hidden rounded-[28px] border border-bond-ink/8 bg-white shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99]"
                >
                  <span className={`relative flex h-28 items-end bg-gradient-to-br p-5 ${entry.tone}`}>
                    <span aria-hidden className="absolute -right-6 -bottom-10 size-36 rounded-full bg-white/20 transition-transform duration-700 ease-smooth group-hover:scale-125" />
                    <span className="relative flex size-12 items-center justify-center rounded-2xl bg-white/90 text-bond-slate shadow-md transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6">
                      <entry.icon className="size-6" aria-hidden />
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="font-heading text-xl font-bold text-bond-ink">{entry.title}</span>
                    <span className="mt-1 text-sm text-bond-ink/65">{entry.text}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-bond-slate">
                      Start
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Recent orders */}
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-bond-ink">Your recent orders</h2>
            <Link href="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-bond-slate hover:underline">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Receipt} title="No orders yet" className="mt-5 py-10">
              When you send a gift, plan a surprise or book an event, you can follow every step here.
            </EmptyState>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {recent.map((item, index) => (
                <Reveal as="li" key={item.id} delay={index * 60}>
                  <Link
                    href={item.href}
                    transitionTypes={["nav-forward"]}
                    className="group flex items-center gap-4 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading font-semibold text-bond-ink">{item.title}</span>
                      <span className="block truncate text-sm text-bond-ink/55">{item.subtitle}</span>
                    </span>
                    {item.badge}
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </section>

        {/* Shops */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-bold text-bond-ink">Shops & vendors</h2>
              <p className="mt-1 text-bond-ink/60">Every shop belongs to a vendor verified by BOND.</p>
            </div>
            <Link href="/shops" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <Store className="size-4" aria-hidden /> Browse all shops
            </Link>
          </div>
          {shops.length === 0 ? (
            <EmptyState icon={Store} title="Shops are opening soon" className="mt-5 py-10">
              Verified vendors are setting up their shops. Check back soon!
            </EmptyState>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop, index) => (
                <Reveal as="li" key={shop.id} delay={index * 70} className="flex">
                  <div className="w-full">
                    <ShopCard shop={shop} />
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </section>

        {/* Account */}
        <section id="account" className="border-t border-bond-ink/8 bg-bond-cream/60">
          <div className="mx-auto grid grid-cols-1 max-w-7xl gap-6 px-4 py-14 sm:px-8 lg:grid-cols-3 lg:px-10">
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-bold text-bond-ink">Your profile</h2>
                <span className="text-xs text-bond-ink/50">Profile editing is coming soon</span>
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="First name" value={profile.first_name} />
                <Detail label="Last name" value={profile.last_name} />
                <Detail label="Email address" value={email} />
                <Detail label="Contact number" value={profile.contact_number} />
                <Detail label="Birthdate" value={formatDateOnly(profile.birthdate)} />
                <Detail label="Member since" value={formatMonthYear(profile.created_at)} />
              </dl>
            </div>

            <div className="rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
              <h2 className="font-heading text-xl font-bold">Account security</h2>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex gap-3">
                  <BadgeCheck className="size-5 shrink-0 text-bond-yellow" aria-hidden />
                  <span>
                    <span className="block font-semibold">{emailConfirmed ? "Email verified" : "Email not verified"}</span>
                    <span className="text-white/65">
                      {emailConfirmed ? "Your sign-in email is confirmed." : "Email confirmation is turned off for this project."}
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <KeyRound className="size-5 shrink-0 text-bond-yellow" aria-hidden />
                  <span>
                    <span className="block font-semibold">Password protected</span>
                    <span className="text-white/65">Managed securely by Supabase Auth — we never see it.</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <MarketFooter />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</dt>
      <dd className="mt-1 text-[0.95rem] text-bond-ink">{value || "Not provided"}</dd>
    </div>
  );
}
