import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email address is required")
  .max(254, "Email address is too long")
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
  remember: z.boolean(),
});

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email");

export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: otpSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.input<typeof loginSchema>;
