import "server-only";

import { isAuthError, type AuthError } from "@supabase/supabase-js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Turns a Supabase Auth error into a message that is safe to show. Never
 * echo raw errors: they can reveal whether an account exists.
 */
export function authErrorMessage(error: AuthError | unknown, fallback: string) {
  if (!isAuthError(error)) return fallback;

  switch (error.code) {
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many requests. Please wait a minute and try again.";
    case "otp_expired":
      return "That code is incorrect or has expired. Check the latest email or request a new code.";
    case "weak_password":
      return "That password is too weak. Choose a stronger one.";
    case "same_password":
      return "Choose a password you haven't used before.";
    case "signup_disabled":
      return "New sign-ups are currently closed.";
    case "email_address_invalid":
      return "Use a different email address.";
    case "email_address_not_authorized":
      return isDev
        ? "Supabase refused to send email to this address. Its built-in mailer only delivers to your project team members — add custom SMTP or test with a team member's email."
        : "We couldn't send email to this address right now. Please try again later.";
  }

  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return isDev
      ? "Can't reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your connection."
      : "We can't reach the sign-in service right now. Please try again shortly.";
  }

  return fallback;
}

export const notConfiguredMessage = isDev
  ? "Supabase isn't configured yet. Add your keys to .env.local (see .env.example) and restart the dev server."
  : "Accounts are temporarily unavailable. Please try again later.";
