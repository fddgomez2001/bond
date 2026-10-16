import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, Store, UserPlus, UserRound, Users, type LucideIcon } from "lucide-react";
import { statusMeta } from "@/components/dashboard/status-badge";
import { Reveal } from "@/components/ui/reveal";
import type { getAdminOverview } from "@/lib/admin/users";
import { formatDateTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { RoleBadge } from "./role-badge";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

export function AdminOverview({ firstName, data }: { firstName: string | null; data: Overview }) {
  const pending = data.statusCounts.pending_review;
  const stats: { label: string; value: number; hint: string; icon: LucideIcon; href?: string; accent?: boolean }[] = [
    { label: "Total users", value: data.totalUsers, hint: `${data.newThisWeek} new this week`, icon: Users, href: "/dashboard/admin/users" },
    { label: "Customers", value: data.roleCounts.customer, hint: "Registered customers", icon: UserRound, href: "/dashboard/admin/users?role=customer" },
    { label: "Vendors", value: data.roleCounts.vendor, hint: `${data.statusCounts.approved} approved`, icon: Store, href: "/dashboard/admin/users?role=vendor" },
    { label: "Pending review", value: pending, hint: pending ? "Waiting for a decision" : "All caught up", icon: ClipboardCheck, href: "/dashboard/admin/vendors", accent: pending > 0 },
  ];

  const totalApplications = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);
  const order: VerificationStatus[] = ["approved", "pending_review", "needs_resubmission", "rejected"];

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Overview"
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        description="A quick look at BOND's members and the vendor applications that need you."
      />

      <WorkspaceContent>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal as="li" key={stat.label} delay={index * 70} className="flex">
              <Link
                href={stat.href ?? "#"}
                className={cn(
                  "group flex w-full flex-col rounded-3xl border p-4 transition-all duration-500 ease-smooth hover:-translate-y-1 sm:p-5",
                  stat.accent
                    ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card-hover)]"
                    : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs font-semibold sm:text-sm", stat.accent ? "text-white/80" : "text-bond-ink/60")}>
                    {stat.label}
                  </span>
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6",
                      stat.accent ? "bg-bond-yellow text-bond-ink" : "bg-bond-yellow/40 text-bond-slate",
                    )}
                  >
                    <stat.icon className="size-[18px]" aria-hidden />
                  </span>
                </span>
                <span className="mt-3 font-heading text-3xl font-bold sm:text-4xl">{stat.value}</span>
                <span className={cn("mt-1 text-xs", stat.accent ? "text-white/70" : "text-bond-ink/55")}>{stat.hint}</span>
              </Link>
            </Reveal>
          ))}
        </ul>

        {/* Application status breakdown */}
        <Reveal delay={120}>
          <section className="mt-6 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-base font-bold text-bond-ink">Vendor applications</h2>
              <span className="text-sm text-bond-ink/55">{totalApplications} total</span>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-bond-ink/5" aria-hidden>
              {order.map((status) =>
                data.statusCounts[status] ? (
                  <span
                    key={status}
                    className={cn("h-full transition-[width] duration-700 ease-smooth", statusMeta[status].dot)}
                    style={{ width: `${(data.statusCounts[status] / totalApplications) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2 lg:grid-cols-4">
              {order.map((status) => (
                <li key={status} className="flex items-center gap-2 text-bond-ink/70">
                  <span className={cn("size-2.5 rounded-full", statusMeta[status].dot)} aria-hidden />
                  {statusMeta[status].label}
                  <span className="font-semibold text-bond-ink">{data.statusCounts[status]}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Waiting longest */}
          <Reveal delay={160}>
            <section className="h-full rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-base font-bold text-bond-ink">Needs your review</h2>
                <Link
                  href="/dashboard/admin/vendors"
                  className="group inline-flex items-center gap-1 text-sm font-semibold text-bond-slate hover:underline"
                >
                  View all
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
              {data.oldestPending.length === 0 ? (
                <p className="mt-6 rounded-2xl bg-bond-paper px-4 py-8 text-center text-sm text-bond-ink/60">
                  No applications are waiting. Nice work!
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-bond-ink/8">
                  {data.oldestPending.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/dashboard/admin/vendors/${item.id}`}
                        transitionTypes={["nav-forward"]}
                        className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors duration-300 hover:bg-bond-paper"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-bond-gold bg-bond-slate text-sm font-bold text-white">
                          {initials(item.person?.first_name, item.person?.last_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-bond-ink">
                            {[item.person?.first_name, item.person?.last_name].filter(Boolean).join(" ") || "Unnamed vendor"}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-bond-ink/55">
                            <Clock3 className="size-3.5" aria-hidden />
                            Submitted {formatDateTime(item.submittedAt)}
                          </span>
                        </span>
                        <span className="rounded-xl bg-bond-yellow px-3 py-1.5 text-xs font-semibold text-bond-ink transition-colors duration-300 group-hover:bg-bond-gold">
                          Review
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>

          {/* Newest members */}
          <Reveal delay={200}>
            <section className="h-full rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-heading text-base font-bold text-bond-ink">
                  <UserPlus className="size-[18px] text-bond-slate" aria-hidden />
                  Newest members
                </h2>
                <Link
                  href="/dashboard/admin/users"
                  className="group inline-flex items-center gap-1 text-sm font-semibold text-bond-slate hover:underline"
                >
                  All users
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-bond-ink/8">
                {data.recent.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bond-yellow/50 text-sm font-bold text-bond-slate">
                      {initials(person.first_name, person.last_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-bond-ink">
                        {[person.first_name, person.last_name].filter(Boolean).join(" ") || "No name"}
                      </span>
                      <span className="block truncate text-xs text-bond-ink/55">{person.email ?? "—"}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <RoleBadge role={person.role} />
                      <span className="text-[0.7rem] text-bond-ink/45">{formatDateTime(person.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>
      </WorkspaceContent>
    </main>
  );
}
