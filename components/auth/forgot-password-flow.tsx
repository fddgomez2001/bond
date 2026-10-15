"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { KeyRound } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { requestPasswordReset, verifyRecoveryCode } from "@/lib/auth/actions";
import { features } from "@/lib/config/features";
import { maskEmail } from "@/lib/utils";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { AuthAsideIntro, AuthFormHeader, AuthShell } from "./auth-shell";
import { OtpInput } from "./otp-input";
import { RegistrationStepper, recoverySteps } from "./registration-stepper";
import { useCooldown } from "./use-cooldown";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Forgot password: email → 6-digit code → /reset-password.
 * With features.passwordRecovery off (the default) this is a static
 * preview: nothing is sent and any 6 digits move you on.
 */
export function ForgotPasswordFlow({ linkError }: { linkError?: boolean }) {
  const live = features.passwordRecovery;
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, startTransition] = useTransition();
  const cooldown = useCooldown();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof forgotPasswordSchema>, unknown, z.output<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function sendCode(address: string) {
    setError(undefined);
    startTransition(async () => {
      if (live) {
        const result = await requestPasswordReset({ email: address });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setNotice(result.message);
      } else {
        await wait(600);
        setNotice("Preview: in the live version, a 6-digit code would be emailed now.");
      }
      setEmail(address);
      setStep(1);
      cooldown.start(features.resendCooldownSeconds);
    });
  }

  function verify() {
    setError(undefined);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter all 6 digits of the code.");
      return;
    }
    startTransition(async () => {
      if (live) {
        const result = await verifyRecoveryCode({ email, token: code });
        // Success redirects to /reset-password.
        if (result && !result.ok) {
          setError(result.message);
          setCode("");
        }
      } else {
        await wait(500);
        router.push("/reset-password");
      }
    });
  }

  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Account recovery" title="Forgot your password?">
            It happens. We&apos;ll help you get back into your account.
          </AuthAsideIntro>
          <RegistrationStepper steps={recoverySteps} current={step} label="Password reset progress" />
        </div>
      }
    >
      {!live && (
        <Alert tone="warning" title="Preview mode" className="mb-6">
          Password recovery email isn&apos;t set up yet, so this flow is a static preview — no email is
          sent and no password changes. Any 6 digits will move you to the next step.
        </Alert>
      )}

      {step === 0 ? (
        <form onSubmit={handleSubmit(({ email: address }) => sendCode(address))} noValidate className="space-y-5">
          <AuthFormHeader
            title="Reset your password"
            description="Enter the email address registered to your BOND account and we'll send you a 6-digit code."
          />
          {linkError && (
            <Alert tone="warning">That reset link is invalid or has expired. Request a new code below.</Alert>
          )}
          <ErrorMessage message={error} />
          <Field id="email" label="Email address" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email", errors.email?.message)}
              {...register("email")}
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Sending code…">
            Send code
          </Button>
          <p className="text-center text-sm text-bond-ink/70">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-bond-slate hover:underline">
              Back to log in
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            verify();
          }}
          noValidate
          className="space-y-5"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-bond-yellow/60 text-bond-slate">
              <KeyRound className="size-6" aria-hidden />
            </span>
            <AuthFormHeader
              title="Enter your code"
              description={
                <>
                  If an account exists for <strong className="text-bond-ink">{maskEmail(email)}</strong>, a
                  6-digit code is on its way.
                </>
              }
            />
          </div>
          {notice && <Alert tone="info">{notice}</Alert>}
          <ErrorMessage message={error} />
          <OtpInput value={code} onChange={setCode} invalid={Boolean(error)} disabled={pending} />
          <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Checking…">
            Verify code
          </Button>
          <div className="flex flex-col items-center gap-2 text-sm">
            <Button
              variant="outline"
              onClick={() => sendCode(email)}
              disabled={cooldown.active || pending}
            >
              {cooldown.active ? `Resend code in ${cooldown.secondsLeft}s` : "Resend code"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setCode("");
                setError(undefined);
                setNotice(undefined);
              }}
              className="font-semibold text-bond-slate hover:underline"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
