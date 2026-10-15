import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Compass,
  KeyRound,
  MapPin,
  Store,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { EventArt } from "@/components/home/event-art";
import { EventDetailsButton } from "@/components/home/event-details-button";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/ui/reveal";
import { demoEvents } from "@/lib/data/demo-events";
import { formatDateOnly, formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { DashboardFooter, DashboardHeader } from "./dashboard-header";

const quickActions: { icon: LucideIcon; title: string; text: string; href?: string }[] = [
  { icon: Compass, title: "Discover events", text: "Browse what's happening around you.", href: "#discover" },
  { icon: Ticket, title: "My bookings", text: "Your tickets and reservations will live here." },
  { icon: Bookmark, title: "Saved events", text: "Keep track of events you're interested in." },
  { icon: Store, title: "Find vendors", text: "Explore approved vendors for your celebrations." },
];

/** Customer landing page shown after sign-up / login. Data comes from the page. */
export function CustomerHome({
  profile,
  email,
  emailConfirmed,
  justVerified,
}: {
  profile: Profile;
  email: string | null;
  emailConfirmed: boolean;
  justVerified: boolean;
}) {
  const firstName = profile.first_name ?? "there";

  return (
    <div className="flex min-h-dvh flex-col bg-bond-paper">
      <DashboardHeader
        firstName={profile.first_name}
        lastName={profile.last_name}
        email={email}
        roleLabel="Customer"
        nav={[
          { label: "Home", href: "/" },
          { label: "Discover", href: "#discover" },
          { label: "My Bookings" },
          { label: "Vendors" },
        ]}
      />

      <main className="flex-1">
        {/* Welcome */}
        <section className="relative overflow-hidden bg-bond-yellow pb-16">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-24 size-[28rem] rounded-full bg-white/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pt-8 sm:px-8 lg:grid-cols-12 lg:items-end lg:px-10 lg:pt-14">
            <div className="lg:col-span-7">
              {justVerified && (
                <Alert tone="success" title="You're all set!" className="mb-6 max-w-xl">
                  Your email is verified and your BOND account is ready.
                </Alert>
              )}
              <h1 className="font-display text-5xl leading-[0.9] tracking-[-0.04em] text-white [text-shadow:0_2px_8px_rgba(56,73,73,0.25)] sm:text-7xl">
                hello, <span className="text-bond-slate">{firstName.toLowerCase()}!</span>
              </h1>
              <p className="mt-6 max-w-xl font-display text-xl leading-snug tracking-[0.03em] text-white [text-shadow:0_1px_3px_rgba(56,73,73,0.45)] sm:text-2xl">
                Discover meaningful events, connect with people, and be part of experiences that bring
                communities together.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#discover"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-bond-slate px-8 font-display text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Explore events
                </Link>
                <Link
                  href="#account"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 font-display text-lg text-bond-slate shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  View my account
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[2rem] border border-white/70 bg-bond-slate/15 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-bond-slate">Your BOND at a glance</p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <Stat label="Member since" value={formatMonthYear(profile.created_at)} />
                  <Stat label="Account type" value="Customer" />
                  <Stat label="Upcoming bookings" value="0" muted />
                  <Stat label="Saved events" value="0" muted />
                </dl>
                <p className="mt-4 text-xs text-bond-slate/70">Bookings and saved events arrive in a later update.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section aria-labelledby="quick-actions" className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-8 lg:px-10">
          <h2 id="quick-actions" className="sr-only">
            Quick actions
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const content = (
                <>
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6",
                      action.href ? "bg-bond-yellow text-bond-slate" : "bg-bond-ink/5 text-bond-ink/40",
                    )}
                  >
                    <action.icon className="size-5" aria-hidden />
                  </span>
                  <span className="mt-4 flex items-center gap-2 font-heading font-semibold text-bond-ink">
                    {action.title}
                    {!action.href && (
                      <span className="rounded-full bg-bond-ink/5 px-2 py-0.5 text-[0.6rem] font-bold tracking-wide text-bond-ink/50 uppercase">
                        Coming soon
                      </span>
                    )}
                  </span>
                  <span className="mt-1 text-sm text-bond-ink/60">{action.text}</span>
                </>
              );
              return (
                <li key={action.title}>
                  {action.href ? (
                    <Link
                      href={action.href}
                      className="group flex h-full flex-col rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] active:translate-y-0 active:scale-[0.99]"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col rounded-3xl border border-bond-ink/8 bg-white/70 p-5">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Discover */}
        <section id="discover" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-16 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-bond-ink sm:text-3xl">Happening soon</h2>
              <p className="mt-1 text-bond-ink/60">Events picked for you will appear here.</p>
            </div>
            <span className="rounded-full bg-bond-amber/15 px-3 py-1 text-xs font-semibold text-[#9a5a00]">
              Demo content
            </span>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {demoEvents.map((event, index) => (
              <Reveal as="li" key={event.id} delay={index * 110} className="flex">
              <article className="group flex w-full flex-col overflow-hidden rounded-[24px] border border-bond-ink/8 bg-white shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)]">
                <div className="overflow-hidden">
                  <EventArt
                    event={event}
                    className="aspect-[16/9] transition-transform duration-700 ease-smooth group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="text-xs font-bold tracking-wide text-bond-amber uppercase">{event.category}</p>
                  <h3 className="font-heading text-lg font-bold text-bond-ink">{event.title}</h3>
                  <p className="flex items-center gap-2 text-sm text-bond-ink/65">
                    <CalendarDays className="size-4 text-bond-slate" aria-hidden /> {event.date}
                  </p>
                  <p className="flex flex-1 items-start gap-2 text-sm text-bond-ink/65">
                    <MapPin className="mt-0.5 size-4 text-bond-slate" aria-hidden /> {event.venue}
                  </p>
                  <EventDetailsButton event={event} />
                </div>
              </article>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Account */}
        <section id="account" className="border-t border-bond-ink/8 bg-bond-cream/60">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-8 lg:grid-cols-3 lg:px-10">
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-bold text-bond-ink">Your profile</h2>
                <span className="text-xs text-bond-ink/50">Profile editing is coming soon</span>
              </div>
              <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
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
                    <span className="block font-semibold">
                      {emailConfirmed ? "Email verified" : "Email not verified"}
                    </span>
                    <span className="text-white/65">
                      {emailConfirmed
                        ? "Your sign-in email is confirmed."
                        : "Email confirmation is turned off for this project."}
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

      <DashboardFooter />
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <dt className="text-xs text-bond-ink/55">{label}</dt>
      <dd className={cn("mt-1 font-heading text-lg font-bold", muted ? "text-bond-ink/40" : "text-bond-ink")}>{value}</dd>
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
