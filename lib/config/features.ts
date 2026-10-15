/**
 * Business rules and feature switches for Phase 1.
 * Values marked TO CONFIRM are safe defaults until the final rules arrive.
 */

export type DocumentRequirement = "off" | "optional" | "required";

export const features = {
  /**
   * Password recovery sends email through Supabase Auth, which needs a
   * working SMTP setup. While this is false the forgot/reset password
   * screens run as a static preview: no email is sent and no password
   * changes. Set NEXT_PUBLIC_ENABLE_PASSWORD_RECOVERY=true to go live.
   */
  passwordRecovery: process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RECOVERY === "true",

  /**
   * Government ID upload for customers. The process diagram shows it, but it
   * is not confirmed for every customer. TO CONFIRM.
   */
  customerGovernmentId: "off" as DocumentRequirement,

  /** Minimum ages in whole years. TO CONFIRM. */
  minimumAge: {
    customer: 18,
    vendor: 18,
  },

  /** Seconds a user must wait before asking for another code. */
  resendCooldownSeconds: 60,
} as const;

/** Password policy used by every password field (sign-up and reset). */
export const passwordPolicy = {
  minLength: 8,
  // bcrypt (used by Supabase Auth) ignores anything past 72 bytes.
  maxLength: 72,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
} as const;
