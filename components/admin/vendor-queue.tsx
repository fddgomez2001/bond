import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, Mail, Phone } from "lucide-react";
import { StatusBadge, statusMeta } from "@/components/dashboard/status-badge";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/ui/reveal";
import { reviewStatuses, type VendorApplicationSummary } from "@/lib/admin/vendor-applications";
import { formatDateTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";

const QUEUE = "/dashboard/admin/vendors";

const emptyCopy: Record<VerificationStatus, string> = {
  pending_review: "All caught up — no applications are waiting for review.",
  needs_resubmission: "No vendors have been asked to resubmit documents.",
  approved: "No vendors have been approved yet.",
  rejected: "No applications have been rejected.",
};

export function VendorQueue({
  status,
  counts,
  applications,
  loadError,
  canReadEmails,
}: {
  status: VerificationStatus;
  counts: Record<VerificationStatus, number>;
  applications: VendorApplicationSummary[];
  loadError: boolean;
  canReadEmails: boolean;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Vendors"
        title="Vendor Applications"
        description="Check each vendor's selfie, government ID and proof of business, then decide who can offer services on BOND."
      />

      <WorkspaceContent>
        {/* Status tabs */}
        <nav aria-label="Filter by status">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {reviewStatuses.map((s) => {
              const meta = statusMeta[s];
              const active = s === status;
              return (
                <li key={s}>
                  <Link
                    href={s === "pending_review" ? QUEUE : `${QUEUE}?status=${s}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-full flex-col rounded-3xl border p-4 transition-all duration-500 ease-smooth sm:p-5",
                      active
                        ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card-hover)]"
                        : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
                    )}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
                      {meta.label}
                    </span>
                    <span className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{counts[s]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ViewTransition key={status} enter="list-in" exit="list-out" default="none">
        <section aria-labelledby="queue-heading" className="pt-8 lg:pt-10">
          <h2 id="queue-heading" className="font-heading text-xl font-bold text-bond-ink sm:text-2xl">
            {statusMeta[status].label}
            <span className="ml-2 text-bond-ink/40">({applications.length})</span>
          </h2>

          {loadError && (
            <Alert tone="error" className="mt-6">
              Applications couldn&apos;t be loaded. Check that the database migrations have been run.
            </Alert>
          )}
          {!canReadEmails && (
            <Alert tone="warning" className="mt-6">
              Vendor emails are hidden because SUPABASE_SERVICE_ROLE_KEY isn&apos;t set on the server.
            </Alert>
          )}

          {applications.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-bond-ink/15 bg-white px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-bond-yellow/40 text-bond-slate">
                <Inbox className="size-7" aria-hidden />
              </span>
              <p className="max-w-sm text-bond-ink/65">{emptyCopy[status]}</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {applications.map((application, index) => {
                const name =
                  [application.firstName, application.lastName].filter(Boolean).join(" ") || "Unnamed vendor";
                return (
                  <Reveal as="li" key={application.id} delay={Math.min(index, 6) * 60}>
                    <Link
                      href={`${QUEUE}/${application.id}`}
                      transitionTypes={["nav-forward"]}
                      className="group flex flex-col gap-4 rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:border-bond-slate/25 hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center sm:p-5"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-bond-gold bg-bond-slate font-bold text-white">
                          {initials(application.firstName, application.lastName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-heading font-semibold text-bond-ink">{name}</span>
                          <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-bond-ink/60">
                            {application.email && (
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <Mail className="size-3.5 shrink-0" aria-hidden />
                                <span className="truncate">{application.email}</span>
                              </span>
                            )}
                            {application.contactNumber && (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="size-3.5" aria-hidden />
                                {application.contactNumber}
                              </span>
                            )}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:justify-end sm:gap-4">
                        <span className="text-xs text-bond-ink/55 sm:text-right">
                          Submitted
                          <br />
                          <span className="text-sm text-bond-ink/75">{formatDateTime(application.submittedAt)}</span>
                        </span>
                        <StatusBadge status={application.status} />
                        <span className="inline-flex items-center gap-1 rounded-xl bg-bond-yellow px-4 py-2 text-sm font-semibold text-bond-ink transition-colors duration-300 group-hover:bg-bond-gold">
                          Review
                          <ArrowRight
                            className="size-4 transition-transform duration-300 ease-smooth group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </section>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}
