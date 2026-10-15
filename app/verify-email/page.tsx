import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthAsideIntro, AuthShell } from "@/components/auth/auth-shell";
import { RegistrationStepper, customerSteps, vendorSteps } from "@/components/auth/registration-stepper";
import { VerificationStatus } from "@/components/auth/verification-status";
import { LoadingState } from "@/components/ui/loading-state";
import { getPendingVerification } from "@/lib/auth/pending-verification";
import { maskEmail } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <Suspense
      fallback={
        <AuthShell aside={<AuthAsideIntro eyebrow="Almost there" title="Verify your email" />}>
          <LoadingState label="Loading verification…" />
        </AuthShell>
      }
    >
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: PageProps<"/verify-email">["searchParams"];
}) {
  const [params, pending] = await Promise.all([searchParams, getPendingVerification()]);
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const linkError =
    params.error === "link-expired" ? "expired" : params.error === "link-invalid" ? "invalid" : undefined;
  const steps = pending?.role === "vendor" ? vendorSteps : customerSteps;
  const verifyStep = steps.findIndex((step) => step.title === "Email Verification");

  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Almost there" title="Verify your email">
            We use your email to keep your account secure and to send you important account updates.
          </AuthAsideIntro>
          {pending?.role && <RegistrationStepper steps={steps} current={verifyStep} />}
        </div>
      }
    >
      <VerificationStatus
        maskedEmail={pending ? maskEmail(pending.email) : null}
        justRegistered={Boolean(pending?.role) && !reason && !linkError}
        reason={reason}
        linkError={linkError}
      />
    </AuthShell>
  );
}
