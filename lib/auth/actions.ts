"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  VISITOR_COOKIE,
  describeRequest,
  recordSignInAttempt,
  validVisitorId,
  type SignInFailure,
} from "@/lib/analytics/record";
import { features } from "@/lib/config/features";
import { checkRateLimits, rateLimits, tooManyAttemptsMessage } from "@/lib/security/rate-limit";
import { appOrigin, getClientIp, safeNextPath } from "@/lib/security/request";
import { SESSION_ONLY_COOKIE, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, forgotPasswordSchema, loginSchema, otpSchema } from "@/lib/validations/auth";
import { newPasswordSchema } from "@/lib/validations/password";
import type { FormState } from "@/types/auth";
import type { UserRole } from "@/types/database";
import { setFlash } from "@/lib/flash";
import { authErrorMessage, notConfiguredMessage } from "./errors";
import {
  RECOVERY_COOKIE,
  clearPendingVerification,
  getPendingVerification,
  markRecoverySession,
  setPendingVerification,
} from "./pending-verification";
import { dashboardPathFor } from "./routes";

const invalid = (error: z.ZodError): FormState => ({
  ok: false,
  message: "Please fix the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"],
});

async function ipAddress() {
  return getClientIp(await headers());
}

async function profileSummary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role, first_name")
    .eq("id", userId)
    .maybeSingle<{ role: UserRole; first_name: string | null }>();
  return { role: data?.role ?? null, firstName: data?.first_name ?? null };
}

/* ------------------------------------------------------------------ */
/* Login / logout                                                      */
/* ------------------------------------------------------------------ */

export async function signIn(input: unknown, next?: string): Promise<FormState> {
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, password, remember } = parsed.data;

  // Every attempt is logged for the admin "Site Visitors" page, after the
  // response is sent so it never slows a login down.
  const device = describeRequest(await headers());
  const visitorId = validVisitorId((await cookies()).get(VISITOR_COOKIE)?.value);
  const logAttempt = (succeeded: boolean, reason: SignInFailure | null, userId: string | null = null) =>
    after(() => recordSignInAttempt({ email, succeeded, reason, userId, visitorId, device }));

  const limit = checkRateLimits(
    [`login:ip:${await ipAddress()}`, `login:email:${email}`],
    rateLimits.login,
  );
  if (!limit.allowed) {
    logAttempt(false, "too_many_attempts");
    return { ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) };
  }

  const supabase = await createClient({ sessionOnly: !remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase only reports this once the password is correct, so it does
    // not reveal anything to someone guessing.
    if (error.code === "email_not_confirmed") {
      logAttempt(false, "email_not_verified");
      await setPendingVerification({ email, role: null });
      redirect("/verify-email?reason=unverified");
    }
    logAttempt(false, error.code === "invalid_credentials" ? "wrong_password" : "error");
    return { ok: false, message: authErrorMessage(error, "Incorrect email or password.") };
  }
  logAttempt(true, null, data.user.id);

  const cookieStore = await cookies();
  if (remember) {
    cookieStore.delete(SESSION_ONLY_COOKIE);
  } else {
    cookieStore.set(SESSION_ONLY_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  const { role, firstName } = await profileSummary(supabase, data.user.id);
  await setFlash("signed-in", firstName);
  redirect(safeNextPath(next, dashboardPathFor(role)));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    // "local" ends only this browser's session. The default ("global") also
    // revokes every other device, leaving their cookies dead — the source of
    // "Invalid Refresh Token: Refresh Token Not Found" on those devices.
    await supabase.auth.signOut({ scope: "local" });
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_ONLY_COOKIE);
  cookieStore.delete(RECOVERY_COOKIE);
  await setFlash("signed-out");
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Email verification (6-digit code from the sign-up email)            */
/* ------------------------------------------------------------------ */

const verifyInput = z.object({ token: otpSchema, email: emailSchema.optional() });

async function resolveVerificationEmail(fallback?: string) {
  const pending = await getPendingVerification();
  return pending?.email ?? fallback ?? null;
}

export async function verifyEmailCode(input: unknown): Promise<FormState> {
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = verifyInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const email = await resolveVerificationEmail(parsed.data.email);
  if (!email) {
    return { ok: false, fieldErrors: { email: ["Enter the email address you signed up with"] } };
  }

  const limit = checkRateLimits(
    [`verify:ip:${await ipAddress()}`, `verify:email:${email}`],
    rateLimits.verifyOtp,
  );
  if (!limit.allowed) return { ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user) {
    return {
      ok: false,
      message: authErrorMessage(
        error,
        "That code is incorrect or has expired. Check the latest email or request a new code.",
      ),
    };
  }

  await clearPendingVerification();
  const { role } = await profileSummary(supabase, data.user.id);
  await setFlash("verified");
  redirect(`${dashboardPathFor(role)}?welcome=1`);
}

export async function resendVerificationCode(input: unknown): Promise<FormState> {
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = z.object({ email: emailSchema.optional() }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const email = await resolveVerificationEmail(parsed.data.email);
  if (!email) {
    return { ok: false, fieldErrors: { email: ["Enter the email address you signed up with"] } };
  }

  const limit = checkRateLimits(
    [`resend:ip:${await ipAddress()}`, `resend:email:${email}`],
    rateLimits.resendOtp,
  );
  if (!limit.allowed) return { ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${appOrigin(await headers())}/auth/confirm?next=/dashboard` },
  });

  // Rate-limit and delivery problems are worth surfacing; anything else gets
  // the generic message so the response can't be used to probe accounts.
  if (
    error &&
    ["over_email_send_rate_limit", "over_request_rate_limit", "email_address_not_authorized"].includes(
      error.code ?? "",
    )
  ) {
    return { ok: false, message: authErrorMessage(error, "We couldn't resend the code.") };
  }

  if (!(await getPendingVerification())) await setPendingVerification({ email, role: null });

  return {
    ok: true,
    message: "If this email is waiting for verification, a new code is on its way.",
  };
}

/* ------------------------------------------------------------------ */
/* Password recovery — only active when features.passwordRecovery is   */
/* true. Until then the screens run as a static preview.               */
/* ------------------------------------------------------------------ */

const recoveryDisabled: FormState = {
  ok: false,
  message: "Password recovery isn't available yet.",
};

export async function requestPasswordReset(input: unknown): Promise<FormState> {
  if (!features.passwordRecovery) return recoveryDisabled;
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email } = parsed.data;

  const limit = checkRateLimits(
    [`reset:ip:${await ipAddress()}`, `reset:email:${email}`],
    rateLimits.passwordReset,
  );
  if (!limit.allowed) return { ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin(await headers())}/auth/confirm?next=/reset-password`,
  });

  // Same answer whether or not the email exists.
  return { ok: true, message: "If an account exists for this email, we've sent a 6-digit code." };
}

export async function verifyRecoveryCode(input: unknown): Promise<FormState> {
  if (!features.passwordRecovery) return recoveryDisabled;
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = z.object({ email: emailSchema, token: otpSchema }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, token } = parsed.data;

  const limit = checkRateLimits(
    [`verify:ip:${await ipAddress()}`, `recovery:email:${email}`],
    rateLimits.verifyOtp,
  );
  if (!limit.allowed) return { ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
  if (error) {
    return {
      ok: false,
      message: authErrorMessage(error, "That code is incorrect or has expired. Request a new one."),
    };
  }

  await markRecoverySession();
  redirect("/reset-password");
}

export async function updatePassword(input: unknown): Promise<FormState> {
  if (!features.passwordRecovery) return recoveryDisabled;
  if (!isSupabaseConfigured()) return { ok: false, message: notConfiguredMessage };

  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || cookieStore.get(RECOVERY_COOKIE)?.value !== "1") {
    return {
      ok: false,
      message: "Your reset session has expired. Request a new code to continue.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authErrorMessage(error, "We couldn't update your password.") };

  cookieStore.delete(RECOVERY_COOKIE);
  // After a password reset, end the session on every device on purpose.
  await supabase.auth.signOut({ scope: "global" });
  await setFlash("password-updated");
  redirect("/login");
}
