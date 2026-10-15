import { BarChart3, Check, Clock3, FileCheck2, Lock, PackageOpen, Store, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { documentTypes, type DocumentType } from "@/lib/config/uploads";
import { cn } from "@/lib/utils";
import type { Profile, VendorProfile, VerificationStatus } from "@/types/database";
import { DashboardFooter, DashboardHeader } from "./dashboard-header";

const statusCopy: Record<VerificationStatus, { title: string; text: string; tone: string }> = {
  pending_review: {
    title: "Application under review",
    text: "Thanks for registering! Our team is reviewing your documents. You'll be able to use vendor tools once your application is approved.",
    tone: "bg-amber-100 text-amber-900",
  },
  needs_resubmission: {
    title: "Action needed",
    text: "Some of your documents need to be resubmitted. Please contact BOND support for details.",
    tone: "bg-orange-100 text-orange-900",
  },
  rejected: {
    title: "Application not approved",
    text: "Your vendor application wasn't approved. Contact BOND support if you have questions.",
    tone: "bg-red-100 text-red-900",
  },
  approved: {
    title: "Application approved",
    text: "Your vendor account is approved. Vendor tools are being built and will appear here soon.",
    tone: "bg-emerald-100 text-emerald-900",
  },
};

const documentColumns: Record<DocumentType, keyof VendorProfile> = {
  selfie: "selfie_path",
  government_id: "government_id_path",
  proof_of_business: "proof_of_business_path",
};

/** Vendor application status page. Data comes from the page. */
export function VendorHome({
  profile,
  vendor,
  email,
  emailConfirmed,
  justVerified,
}: {
  profile: Profile;
  vendor: VendorProfile | null;
  email: string | null;
  emailConfirmed: boolean;
  justVerified: boolean;
}) {
  const status: VerificationStatus = vendor?.business_verification_status ?? "pending_review";
  const copy = statusCopy[status];
  const approved = status === "approved";
  const documentsSubmitted = Boolean(vendor?.submitted_at);

  const timeline = [
    { label: "Account created", done: true },
    { label: "Email verified", done: emailConfirmed },
    { label: "Documents submitted", done: documentsSubmitted },
    { label: "Business review", done: approved, current: status === "pending_review" },
    { label: "Vendor tools unlocked", done: approved },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-bond-paper">
      <DashboardHeader
        firstName={profile.first_name}
        lastName={profile.last_name}
        email={email}
        roleLabel="Vendor"
        nav={[{ label: "Home", href: "/" }, { label: "My Store" }, { label: "Orders" }]}
      />

      <main className="flex-1">
        <section className="bg-bond-yellow pb-14">
          <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 lg:px-10 lg:pt-12">
            {justVerified && (
              <Alert tone="success" title="Email verified" className="mb-6 max-w-2xl">
                Your registration has been submitted. Your documents may take some time to review.
              </Alert>
            )}
            <p className="text-sm font-semibold text-bond-slate">Vendor application</p>
            <h1 className="mt-2 font-display text-4xl leading-tight tracking-[-0.03em] text-bond-slate sm:text-6xl">
              Welcome, {profile.first_name ?? "vendor"}
            </h1>
            <div className="mt-6 flex max-w-3xl flex-col gap-3 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:gap-5">
              <span className={cn("inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold", copy.tone)}>
                <Clock3 className="size-3.5" aria-hidden />
                {status.replace("_", " ")}
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-bond-ink">{copy.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-bond-ink/70">{copy.text}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-8 lg:grid-cols-3 lg:px-10">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
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

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
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

          <section className="rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="font-heading text-lg font-bold">Vendor tools</h2>
            <p className="mt-1 text-xs text-white/60">
              {approved ? "Coming in the next phase." : "Unlocks after your application is approved."}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: Store, label: "Store profile" },
                { icon: PackageOpen, label: "Services & packages" },
                { icon: BarChart3, label: "Orders & insights" },
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
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
