import { ViewTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  CircleCheck,
  CircleX,
  Eye,
  HelpCircle,
  KeyRound,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/marketplace/bits";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { activityRanges, type ActivityRange, type Breakdown, type SiteActivity, type VisitorSummary } from "@/lib/admin/site-activity";
import { formatDateTime, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RoleBadge } from "./role-badge";

const BASE = "/dashboard/admin/visitors";

const deviceIcons: Record<VisitorSummary["deviceType"], LucideIcon> = {
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: HelpCircle,
};

const reasonLabels: Record<string, string> = {
  wrong_password: "Wrong email or password",
  email_not_verified: "Email not verified yet",
  too_many_attempts: "Blocked: too many tries",
  error: "Sign-in error",
};

const href = (range: ActivityRange, local: boolean) => ({
  pathname: BASE,
  query: { ...(range !== "7d" && { range }), ...(local && { local: "1" }) },
});

const deviceLabel = (v: { deviceModel: string | null; os: string | null; deviceType: VisitorSummary["deviceType"] }) =>
  v.deviceModel ?? (v.deviceType === "desktop" ? "Computer" : v.deviceType === "tablet" ? "Tablet" : v.deviceType === "phone" ? "Phone" : "Unknown device");

/** Admin: who is visiting BOND, on what device and browser, and how often. */
export function SiteVisitors({ range, includeLocal, data }: { range: ActivityRange; includeLocal: boolean; data: SiteActivity }) {
  const stats: { label: string; value: number; hint: string; icon: LucideIcon; accent?: boolean }[] = [
    { label: "Visitors", value: data.totals.visitors, hint: `${data.totals.phones} on a phone`, icon: Users, accent: true },
    { label: "Visits", value: data.totals.visits, hint: "Separate trips to the site", icon: MousePointerClick },
    { label: "Pages viewed", value: data.totals.pageViews, hint: `${data.totals.signedIn} visitors were logged in`, icon: Eye },
    {
      label: "Sign-in attempts",
      value: data.totals.attempts,
      hint: data.totals.failedAttempts ? `${data.totals.failedAttempts} failed` : "None failed",
      icon: KeyRound,
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Site Visitors"
        title="Site Visitors"
        description="Who is using BOND: the phone or computer and browser they use, where they're browsing from, and how often they come back. Sign-in attempts are listed at the bottom."
      />
      <WorkspaceContent>
        {data.setupNeeded && (
          <Alert tone="warning" title="Visitor tracking isn't set up yet" className="mb-6">
            Run <code className="rounded bg-white/60 px-1 break-all">supabase/migrations/20261017000000_site_activity.sql</code> in the
            Supabase SQL Editor, then redeploy. Visits are recorded from then on.
          </Alert>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Time range" className="-mx-1 overflow-x-auto px-1 pb-1">
            <ul className="flex w-max gap-2">
              {activityRanges.map((r) => (
                <li key={r.value}>
                  <Link
                    href={href(r.value, includeLocal)}
                    scroll={false}
                    aria-current={r.value === range ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-smooth",
                      r.value === range
                        ? "border-bond-slate bg-bond-slate text-white"
                        : "border-bond-ink/10 bg-white text-bond-ink/70 hover:border-bond-slate/30",
                    )}
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={href(range, !includeLocal)}
            scroll={false}
            className="inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm text-bond-ink/65 transition-colors hover:bg-bond-ink/5 lg:self-auto"
          >
            <span
              aria-hidden
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors duration-300",
                includeLocal ? "bg-bond-slate" : "bg-bond-ink/20",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-300",
                  includeLocal && "translate-x-4",
                )}
              />
            </span>
            Include local testing (localhost)
          </Link>
        </div>

        <ViewTransition key={`${range}-${includeLocal}`} enter="list-in" exit="list-out" default="none">
          <div className="space-y-6 pt-6">
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <Reveal as="li" key={stat.label} delay={index * 60}>
                  <div
                    className={cn(
                      "flex h-full flex-col rounded-3xl border p-4 sm:p-5",
                      stat.accent ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-xs font-semibold sm:text-sm", stat.accent ? "text-white/80" : "text-bond-ink/60")}>{stat.label}</span>
                      <stat.icon className={cn("size-5", stat.accent ? "text-bond-yellow" : "text-bond-slate")} aria-hidden />
                    </span>
                    <span className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{stat.value.toLocaleString("en-PH")}</span>
                    <span className={cn("mt-1 text-xs", stat.accent ? "text-white/70" : "text-bond-ink/55")}>{stat.hint}</span>
                  </div>
                </Reveal>
              ))}
            </ul>

            {data.totals.pageViews === 0 ? (
              <EmptyState icon={Activity} title="No visits in this period">
                {data.localHidden
                  ? "Only local testing (localhost) visits were found. Turn on “Include local testing” to see them."
                  : "Visits appear here a few seconds after someone opens a page on the website."}
              </EmptyState>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <BreakdownCard title="Devices" items={data.breakdowns.devices} />
                  <BreakdownCard title="Phones & computers" items={data.breakdowns.models} />
                  <BreakdownCard title="Browsers & apps" items={data.breakdowns.browsers} />
                  <BreakdownCard title="Operating systems" items={data.breakdowns.systems} />
                  <BreakdownCard title="Where they browse from" items={data.breakdowns.places} />
                  <BreakdownCard title="Most viewed pages" items={data.breakdowns.pages} mono />
                </div>
                {data.breakdowns.referrers.length > 0 && (
                  <p className="text-sm text-bond-ink/60">
                    <span className="font-semibold text-bond-ink/75">Came from: </span>
                    {data.breakdowns.referrers.map((r) => `${r.label} (${r.count})`).join(" · ")}
                  </p>
                )}

                <Section title="Visitors" subtitle={`Each row is one browser on one device, newest first${data.visitors.length >= 150 ? " (latest 150)" : ""}.`}>
                  <VisitorTable visitors={data.visitors} now={data.now} />
                </Section>
              </>
            )}

            <Section title="Sign-in attempts" subtitle="Every try to log in, successful or not.">
              {data.attempts.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-bond-ink/15 bg-white px-5 py-8 text-center text-sm text-bond-ink/60">
                  No sign-in attempts in this period.
                </p>
              ) : (
                <AttemptList attempts={data.attempts} now={data.now} />
              )}
            </Section>

            <p className="text-xs text-bond-ink/50">
              Device and browser come from what each browser reports; iPhones don&apos;t share their exact model, and some
              Android browsers only share it on newer versions. Locations are approximate (city level) and only available on
              the live site. No IP addresses are stored, and records are deleted after 90 days.
              {data.capped && " Showing the most recent 20,000 page views."}
            </p>
          </div>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-bond-ink">{title}</h2>
      <p className="mb-4 text-sm text-bond-ink/60">{subtitle}</p>
      {children}
    </section>
  );
}

function BreakdownCard({ title, items, mono }: { title: string; items: Breakdown; mono?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-heading text-sm font-bold text-bond-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-bond-ink/50">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn("min-w-0 truncate text-bond-ink/80", mono && "font-mono text-xs")}>{item.label}</span>
                <span className="font-semibold text-bond-ink tabular-nums">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bond-ink/5" aria-hidden>
                <div className="h-full rounded-full bg-bond-amber" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountCell({ account }: { account: VisitorSummary["account"] }) {
  if (!account) return <span className="text-sm text-bond-ink/50">Guest</span>;
  return (
    <span className="block min-w-0">
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="truncate text-sm font-semibold text-bond-ink">{account.name}</span>
        {account.role && <RoleBadge role={account.role} className="px-2! py-0.5! text-[0.65rem]!" />}
      </span>
      {account.email && <span className="block truncate text-xs text-bond-ink/55">{account.email}</span>}
    </span>
  );
}

function VisitorTable({ visitors, now }: { visitors: VisitorSummary[]; now: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)]">
      {/* Desktop: table */}
      <table className="hidden w-full text-left text-sm lg:table">
        <thead className="bg-bond-paper text-xs font-semibold tracking-wide text-bond-ink/55 uppercase">
          <tr>
            <th className="px-5 py-3">Device</th>
            <th className="px-5 py-3">Browser</th>
            <th className="px-5 py-3">Account</th>
            <th className="px-5 py-3">Location</th>
            <th className="px-5 py-3 text-right">Visits</th>
            <th className="px-5 py-3">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bond-ink/8">
          {visitors.map((v) => {
            const Icon = deviceIcons[v.deviceType];
            return (
              <tr key={v.visitorId} className="align-top transition-colors hover:bg-bond-paper/60">
                <td className="px-5 py-3.5">
                  <span className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bond-yellow/40 text-bond-slate">
                      <Icon className="size-[18px]" aria-label={v.deviceType} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-bond-ink">{deviceLabel(v)}</span>
                      <span className="block text-xs text-bond-ink/55">{v.os ?? "Unknown system"}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-bond-ink/80">{v.browser ?? "Unknown"}</td>
                <td className="max-w-56 px-5 py-3.5">
                  <AccountCell account={v.account} />
                </td>
                <td className="px-5 py-3.5 text-bond-ink/75">{v.location ?? "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="block font-heading text-lg font-bold text-bond-ink tabular-nums">{v.visits}</span>
                  <span className="block text-xs text-bond-ink/55">{v.pageViews} page{v.pageViews === 1 ? "" : "s"}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="block text-bond-ink" title={formatDateTime(v.lastSeen)}>
                    {formatTimeAgo(v.lastSeen, now)}
                  </span>
                  <span className="block max-w-48 truncate font-mono text-xs text-bond-ink/55">{v.lastPath}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Phones and tablets: cards */}
      <ul className="divide-y divide-bond-ink/8 lg:hidden">
        {visitors.map((v) => {
          const Icon = deviceIcons[v.deviceType];
          return (
            <li key={v.visitorId} className="flex gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bond-yellow/40 text-bond-slate">
                <Icon className="size-5" aria-label={v.deviceType} />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-bond-ink">{deviceLabel(v)}</span>
                    <span className="block truncate text-xs text-bond-ink/55">
                      {[v.os, v.browser].filter(Boolean).join(" · ") || "Unknown"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-heading text-lg leading-none font-bold text-bond-ink">{v.visits}</span>
                    <span className="text-[0.7rem] text-bond-ink/55">visit{v.visits === 1 ? "" : "s"}</span>
                  </span>
                </div>
                <AccountCell account={v.account} />
                <p className="text-xs text-bond-ink/55">
                  {v.location ?? "Location unknown"} · {formatTimeAgo(v.lastSeen, now)} · {v.pageViews} page{v.pageViews === 1 ? "" : "s"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AttemptList({ attempts, now }: { attempts: SiteActivity["attempts"]; now: number }) {
  return (
    <ul className="divide-y divide-bond-ink/8 overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)]">
      {attempts.map((a) => {
        const Icon = deviceIcons[a.deviceType];
        return (
          <li key={a.id} className="flex flex-col gap-2 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:gap-4">
            <span
              className={cn(
                "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                a.succeeded ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900",
              )}
            >
              {a.succeeded ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleX className="size-3.5" aria-hidden />}
              {a.succeeded ? "Signed in" : "Failed"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-bond-ink">{a.account?.name ?? a.email}</span>
              <span className="block truncate text-xs text-bond-ink/55">
                {a.account ? a.email : null}
                {a.account ? " · " : null}
                {a.succeeded ? "Logged in" : (reasonLabels[a.reason ?? "error"] ?? "Failed")}
              </span>
            </span>
            <span className="flex items-center gap-2 text-xs text-bond-ink/65 sm:w-64">
              <Icon className="size-4 shrink-0 text-bond-slate" aria-hidden />
              <span className="truncate">{[a.device, a.browser, a.location].filter(Boolean).join(" · ") || "Unknown device"}</span>
            </span>
            <span className="shrink-0 text-xs text-bond-ink/55 sm:w-28 sm:text-right" title={formatDateTime(a.at)}>
              {formatTimeAgo(a.at, now)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
