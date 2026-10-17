import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CircleAlert, ExternalLink, FileText, ImageOff } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Reveal } from "@/components/ui/reveal";
import type { getVendorApplication } from "@/lib/admin/vendor-applications";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import { initials } from "@/lib/utils";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { ReviewForm } from "./review-form";

type Application = NonNullable<Awaited<ReturnType<typeof getVendorApplication>>>;

export function VendorReview({ application }: { application: Application }) {
  const { vendor, person, email, emailConfirmed, reviewerName, documents } = application;
  const name = [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Unnamed vendor";

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow={
          <Link
            href="/dashboard/admin/vendors"
            transitionTypes={["nav-back"]}
            className="group -ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 normal-case tracking-normal transition-colors duration-300 hover:bg-white/30"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden />
            All applications
          </Link>
        }
        title={
          <span className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-bond-gold bg-bond-slate font-display text-xl font-semibold text-white shadow-[var(--shadow-avatar)]">
              {initials(person?.first_name, person?.last_name)}
            </span>
            <span className="min-w-0 truncate">{name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={vendor.business_verification_status} />
            <span>Submitted {formatDateTime(vendor.submitted_at)}</span>
          </span>
        }
      />

      <WorkspaceContent>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            {/* Vendor details */}
            <Reveal>
              <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h2 className="font-heading text-lg font-bold text-bond-ink">Vendor details</h2>
                <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Detail label="Email address">
                    <span className="break-all">{email ?? "Hidden (service role key not set)"}</span>
                    {email && (
                      <span
                        className={
                          emailConfirmed
                            ? "ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                            : "ml-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"
                        }
                      >
                        {emailConfirmed ? <BadgeCheck className="size-3.5" aria-hidden /> : <CircleAlert className="size-3.5" aria-hidden />}
                        {emailConfirmed ? "Verified" : "Not verified"}
                      </span>
                    )}
                  </Detail>
                  <Detail label="Contact number">{person?.contact_number ?? "Not provided"}</Detail>
                  <Detail label="Birthdate">{formatDateOnly(person?.birthdate ?? null)}</Detail>
                  <Detail label="Registered">{formatDateTime(person?.created_at ?? vendor.created_at)}</Detail>
                </dl>
              </section>
            </Reveal>

            {/* Documents */}
            <Reveal delay={80}>
              <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-heading text-lg font-bold text-bond-ink">Documents</h2>
                  <p className="text-xs text-bond-ink/55">Private links — they expire after 10 minutes. Refresh to renew.</p>
                </div>
                <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {documents.map((doc) => (
                    <li key={doc.type} className="flex flex-col overflow-hidden rounded-2xl border border-bond-ink/10">
                      <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-conic-gradient(#f7f3e6_0%_25%,#fffdf6_0%_50%)] bg-[length:20px_20px]">
                        {!doc.url ? (
                          <span className="flex flex-col items-center gap-2 text-sm text-bond-ink/50">
                            <ImageOff className="size-7" aria-hidden />
                            Not submitted
                          </span>
                        ) : doc.isPdf ? (
                          <span className="flex flex-col items-center gap-2 text-sm text-bond-ink/60">
                            <FileText className="size-10 text-bond-slate" aria-hidden />
                            PDF document
                          </span>
                        ) : (
                          // Short-lived signed URL from private storage; next/image can't cache it.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doc.url}
                            alt={`${doc.label} submitted by ${name}`}
                            className="size-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-bond-ink/10 px-4 py-3">
                        <span className="text-sm font-semibold text-bond-ink">{doc.label}</span>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-bond-slate transition-colors hover:bg-bond-slate/10"
                          >
                            Open
                            <ExternalLink className="size-3.5" aria-hidden />
                            <span className="sr-only"> {doc.label} in a new tab</span>
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          </div>

          {/* Decision */}
          <aside className="xl:col-span-4">
            <div className="space-y-6 xl:sticky xl:top-6">
              {vendor.reviewed_at && (
                <section className="rounded-3xl border border-bond-ink/10 bg-bond-cream/60 p-6">
                  <h2 className="font-heading text-base font-bold text-bond-ink">Last review</h2>
                  <p className="mt-1 text-xs text-bond-ink/55">
                    {formatDateTime(vendor.reviewed_at)}
                    {reviewerName ? ` · by ${reviewerName}` : ""}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-line text-bond-ink/80">
                    {vendor.review_notes || "No notes were left."}
                  </p>
                </section>
              )}
              <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h2 className="font-heading text-lg font-bold text-bond-ink">
                  {vendor.reviewed_at ? "Change decision" : "Your decision"}
                </h2>
                <p className="mt-1 mb-5 text-sm text-bond-ink/60">
                  The vendor sees the result and your notes on their dashboard.
                </p>
                <ReviewForm applicationId={vendor.id} />
              </section>
            </div>
          </aside>
        </div>
      </WorkspaceContent>
    </main>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</dt>
      <dd className="mt-1 text-[0.95rem] text-bond-ink">{children}</dd>
    </div>
  );
}
