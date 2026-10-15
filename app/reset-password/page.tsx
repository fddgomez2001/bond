import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthAsideIntro, AuthFormHeader, AuthShell } from "@/components/auth/auth-shell";
import { RegistrationStepper, recoverySteps } from "@/components/auth/registration-stepper";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonClasses } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { RECOVERY_COOKIE } from "@/lib/auth/pending-verification";
import { getSessionUser } from "@/lib/auth/session";
import { features } from "@/lib/config/features";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Account recovery" title="Almost done">
            Pick a new password and you&apos;re back in.
          </AuthAsideIntro>
          <RegistrationStepper steps={recoverySteps} current={2} label="Password reset progress" />
        </div>
      }
    >
      {features.passwordRecovery ? (
        <Suspense fallback={<LoadingState label="Checking your reset session…" />}>
          <LiveResetPassword />
        </Suspense>
      ) : (
        <ResetPasswordForm preview />
      )}
    </AuthShell>
  );
}

/** Only shows the form to a session opened by a recovery code or link. */
async function LiveResetPassword() {
  const [user, cookieStore] = await Promise.all([getSessionUser(), cookies()]);
  const validSession = user && cookieStore.get(RECOVERY_COOKIE)?.value === "1";

  if (!validSession) {
    return (
      <div className="space-y-6">
        <AuthFormHeader
          title="Reset link expired"
          description="This password reset session is invalid, has expired, or was already used. Request a new code to continue."
        />
        <Link href="/forgot-password" className={buttonClasses({ size: "lg", className: "w-full" })}>
          Request a new code
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm preview={false} />;
}
