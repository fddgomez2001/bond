"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { resendVerificationCode, verifyEmailCode } from "@/lib/auth/actions";
import { features } from "@/lib/config/features";
import { OtpInput } from "./otp-input";
import { useCooldown } from "./use-cooldown";

const MAX_ATTEMPTS = 5;

/**
 * "Check your email" step. Accepts the 6-digit code from the Supabase email;
 * the link in the same email works too (handled by /auth/confirm).
 */
export function VerificationStatus({
  maskedEmail,
  justRegistered,
  reason,
  linkError,
}: {
  /** Masked address from the pending-verification cookie, if any. */
  maskedEmail: string | null;
  justRegistered: boolean;
  reason?: string;
  /** "expired": Supabase rejected the link; "invalid": our callback couldn't use it. */
  linkError?: "expired" | "invalid";
}) {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [failures, setFailures] = useState(0);
  const [verifying, startVerify] = useTransition();
  const [resending, startResend] = useTransition();
  // Supabase also enforces a gap between emails; start the timer right after sign-up.
  const cooldown = useCooldown(justRegistered ? features.resendCooldownSeconds : 0);

  const needsEmail = !maskedEmail;
  const locked = failures >= MAX_ATTEMPTS;

  function verify() {
    setError(undefined);
    setNotice(undefined);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter all 6 digits of the code.");
      return;
    }
    startVerify(async () => {
      const result = await verifyEmailCode({ token: code, email: needsEmail ? email : undefined });
      // Success redirects to the dashboard, so only failures come back.
      if (result && !result.ok) {
        setFailures((n) => n + 1);
        setError(result.fieldErrors?.email?.[0] ?? result.fieldErrors?.token?.[0] ?? result.message);
        setCode("");
      }
    });
  }

  function resend() {
    setError(undefined);
    setNotice(undefined);
    startResend(async () => {
      const result = await resendVerificationCode({ email: needsEmail ? email : undefined });
      if (result.ok) {
        setNotice(result.message);
        setFailures(0);
        cooldown.start(features.resendCooldownSeconds);
      } else {
        setError(result.fieldErrors?.email?.[0] ?? result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-bond-yellow/60 text-bond-slate">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold text-bond-ink sm:text-3xl">Check your email</h2>
          <p className="text-[0.95rem] text-bond-ink/65">
            {maskedEmail ? (
              <>
                If <strong className="text-bond-ink">{maskedEmail}</strong> is new to BOND, we&apos;ve sent it a
                6-digit verification code.
              </>
            ) : (
              "Enter the email you signed up with and the 6-digit code we sent to it."
            )}
          </p>
        </div>
      </div>

      {reason === "unverified" && (
        <Alert tone="info" title="Verify your email to continue">
          Your account exists but its email isn&apos;t verified yet. Enter the code from your email, or
          request a new one.
        </Alert>
      )}
      {linkError === "expired" && (
        <Alert tone="info" title="That link was already used or has expired">
          <p>
            Verification links work only once. If you clicked it before, your email is probably verified
            already — try logging in. Otherwise, request a new code below.
          </p>
          <Link href="/login" className={buttonClasses({ size: "sm", className: "mt-3" })}>
            Log in
          </Link>
        </Alert>
      )}
      {linkError === "invalid" && (
        <Alert tone="warning" title="That link didn't work">
          Some verification links only work in the browser you signed up in. Enter the code instead, or
          request a new one.
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      <ErrorMessage message={error} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
        noValidate
        className="space-y-5"
      >
        {needsEmail && (
          <Field id="verify-email" label="Email address" required>
            <Input
              id="verify-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </Field>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-bond-ink">Verification code</p>
          <OtpInput value={code} onChange={setCode} invalid={Boolean(error)} disabled={verifying || locked} />
        </div>

        {locked ? (
          <Alert tone="warning">Too many incorrect attempts. Request a new code to try again.</Alert>
        ) : (
          <Button type="submit" size="lg" className="w-full" loading={verifying} loadingText="Verifying…">
            Verify email
          </Button>
        )}
      </form>

      <div className="flex flex-col items-center gap-2 border-t border-bond-ink/10 pt-5 text-sm text-bond-ink/70">
        <p>Didn&apos;t get it? Check your spam folder first.</p>
        <Button
          variant="outline"
          onClick={resend}
          loading={resending}
          loadingText="Sending…"
          disabled={cooldown.active || (needsEmail && !email)}
        >
          {cooldown.active ? `Resend code in ${cooldown.secondsLeft}s` : "Resend code"}
        </Button>
        <Link href="/login" className="mt-2 font-semibold text-bond-slate hover:underline">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
