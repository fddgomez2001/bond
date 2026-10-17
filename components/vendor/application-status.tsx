import { Check, Clock3, FileCheck2, Lock, PackageOpen, Receipt, Store, X } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { documentTypes, type DocumentType } from "@/lib/config/uploads";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile, VendorProfile, VerificationStatus } from "@/types/database";

const statusCopy: Record<Exclude<VerificationStatus, "approved">, { title: string; text: string }> = {
  pending_review: {
    title: "Application under review",
    text: "Thanks for registering! Our team is reviewing your documents. Your shop, products and orders unlock as soon as you're approved.",
  },
  needs_resubmission: {
    title: "Action needed",
    text: "Some of your documents need to be resubmitted — see the reviewer's notes below. Contact BOND support to send new copies.",
  },
  rejected: {
    title: "Application not approved",
    text: "Your vendor application wasn't approved. The reviewer's notes are below; contact BOND support if you have questions.",
  },
};

const documentColumns: Record<DocumentType, keyof VendorProfile> = {
  selfie: "selfie_path",
  government_id: "government_id_path",
  proof_of_business: "proof_of_business_path",
};

/**
 * The flow's "Account Verified? → No" branch: what's happening with the
 * application, and which tools unlock once it's approved.
 */
export function ApplicationStatus({
  profile,
  vendor,
  emailConfirmed,
  justVerified,
}: {
  profile: Profile;
  vendor: VendorProfile | null;
  emailConfirmed: boolean;
  justVerified: boolean;
}) {
  const status = (vendor?.business_verification_status ?? "pending_review") as Exclude<VerificationStatus, "approved">;
  const copy = statusCopy[status] ?? statusCopy.pending_review;
  const documentsSubmitted = Boolean(vendor?.submitted_at);

  const timeline = [
    { label: "Account created", done: true },
    { label: "Email verified", done: emailConfirmed },
    { label: "Documents submitted", done: documentsSubmitted },
    { label: "Business review", done: false, current: status !== "rejected" },
    { label: "Vendor tools unlocked", done: false },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Vendor · Application"
        title={`Welcome, ${profile.first_name ?? "vendor"}`}
        description="Your vendor tools unlock once BOND verifies your business."
      />

      <WorkspaceContent>
        {justVerified && (
          <Alert tone="success" title="Email verified" className="mb-6 max-w-2xl">
            Your registration has been submitted. Your documents may take some time to review.
          </Alert>
        )}

        <Reveal>
          <section className="flex flex-col gap-3 rounded-3xl border border-bond-ink/8 bg-white p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:gap-5">
            <StatusBadge status={status} className="self-start" />
            <div>
              <h2 className="font-heading text-lg font-bold text-bond-ink">{copy.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-bond-ink/70">{copy.text}</p>
              {vendor?.review_notes && status !== "pending_review" && (
                <div className="mt-4 rounded-2xl border border-bond-ink/10 bg-bond-cream/70 p-4">
                  <p className="text-xs font-semibold tracking-wide text-bond-ink/55 uppercase">
                    Reviewer&apos;s notes · {formatDateTime(vendor.reviewed_at)}
                  </p>
                  <p className="mt-1.5 text-sm whitespace-pre-line text-bond-ink/85">{vendor.review_notes}</p>
                </div>
              )}
            </div>
          </section>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal delay={60}>
            <section className="h-full rounded-3xl border border-bond-ink/8 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-heading text-lg font-bold text-bond-ink">Progress</h2>
              <ol className="mt-6 space-y-5">
                {timeline.map((step) => (
                  <li key={step.label} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                        step.done && "border-bond-slate bg-bond-slate text-white",
                        !step.done && step.current && "border-bond-amber text-bond-amber",
                        !step.done && !step.current && "border-bond-ink/15 text-bond-ink/30",
                      )}
                    >
                      {step.done ? <Check className="size-4" aria-hidden /> : <Clock3 className="size-3.5" aria-hidden />}
                    </span>
                    <span className={cn(step.done || step.current ? "text-bond-ink" : "text-bond-ink/45")}>
                      {step.label}
                      {step.current && <span className="ml-2 text-xs font-semibold text-bond-amber">In progress</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className="h-full rounded-3xl border border-bond-ink/8 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-heading text-lg font-bold text-bond-ink">Submitted documents</h2>
              <p className="mt-1 text-xs text-bond-ink/55">Stored privately — only you and BOND reviewers can access them.</p>
              <ul className="mt-6 space-y-3">
                {(Object.keys(documentColumns) as DocumentType[]).map((type) => {
                  const submitted = Boolean(vendor?.[documentColumns[type]]);
                  return (
                    <li key={type} className="flex items-center justify-between gap-3 rounded-2xl bg-bond-paper px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-bond-ink">
                        <FileCheck2 className="size-4 text-bond-slate" aria-hidden />
                        {documentTypes[type].label}
                      </span>
                      {submitted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <Check className="size-3.5" aria-hidden /> Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                          <X className="size-3.5" aria-hidden /> Missing
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={180}>
            <section className="h-full rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)]">
              <h2 className="font-heading text-lg font-bold">Vendor tools</h2>
              <p className="mt-1 text-xs text-white/60">Unlocks after your application is approved.</p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Store, label: "Your shop page" },
                  { icon: PackageOpen, label: "Products, surprises & services" },
                  { icon: Receipt, label: "Orders, sales & reviews" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-bond-yellow" aria-hidden />
                      {label}
                    </span>
                    <Lock className="size-4 text-white/50" aria-label="Locked" />
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
