import { z } from "zod";
import { passwordPolicy } from "@/lib/config/features";

type PasswordRule = { id: string; label: string; test: (value: string) => boolean };

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${passwordPolicy.minLength} characters`,
    test: (v) => v.length >= passwordPolicy.minLength,
  },
  ...(passwordPolicy.requireLowercase
    ? [{ id: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) }]
    : []),
  ...(passwordPolicy.requireUppercase
    ? [{ id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) }]
    : []),
  ...(passwordPolicy.requireNumber
    ? [{ id: "number", label: "One number", test: (v: string) => /\d/.test(v) }]
    : []),
  ...(passwordPolicy.requireSymbol
    ? [{ id: "symbol", label: "One symbol (e.g. ! @ # $)", test: (v: string) => /[^A-Za-z0-9]/.test(v) }]
    : []),
];

export const passwordSchema = z
  .string()
  .max(passwordPolicy.maxLength, `Use ${passwordPolicy.maxLength} characters or fewer`)
  .superRefine((value, ctx) => {
    const failed = passwordRules.filter((rule) => !rule.test(value));
    if (failed.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Password needs: ${failed.map((rule) => rule.label.toLowerCase()).join(", ")}.`,
      });
    }
  });

/** Password + confirmation pair, used by sign-up and reset. */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
