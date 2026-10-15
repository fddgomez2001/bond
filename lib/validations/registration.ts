import { z } from "zod";
import { features } from "@/lib/config/features";
import { emailSchema } from "./auth";
import { passwordSchema } from "./password";

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' .-]*$/u;

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be 50 characters or fewer`)
    .regex(NAME_PATTERN, `${label} can only contain letters, spaces, apostrophes, periods and hyphens`);

/** Whole years between an ISO date (YYYY-MM-DD) and today. */
export function ageFromBirthdate(isoDate: string, today = new Date()) {
  const [year, month, day] = isoDate.split("-").map(Number);
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

function isRealDate(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const birthdateSchema = (minimumAge: number) =>
  z
    .string()
    .min(1, "Birthdate is required")
    .refine(isRealDate, "Enter a valid date")
    .refine((value) => !isRealDate(value) || ageFromBirthdate(value) >= 0, "Birthdate cannot be in the future")
    .refine(
      (value) => !isRealDate(value) || ageFromBirthdate(value) <= 120,
      "Enter a valid birthdate",
    )
    .refine(
      (value) => !isRealDate(value) || ageFromBirthdate(value) >= minimumAge,
      `You must be at least ${minimumAge} years old to register`,
    );

const contactNumberSchema = z
  .string()
  .trim()
  .min(1, "Contact number is required")
  .max(20, "Contact number must be 20 characters or fewer")
  // Keep in sync with the contact_number check in the profiles migration.
  .regex(/^\+?[\d ()-]+$/, "Use digits, spaces, dashes, and an optional leading +")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  }, "Contact number must have 7 to 15 digits");

const personalInfoShape = (minimumAge: number) => ({
  firstName: nameSchema("First name"),
  lastName: nameSchema("Last name"),
  birthdate: birthdateSchema(minimumAge),
  contactNumber: contactNumberSchema,
  email: emailSchema,
});

const credentialsShape = {
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm your password"),
};

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  params: { message: "Passwords do not match", path: ["confirmPassword"] },
};

export const customerRegistrationSchema = z
  .object({ ...personalInfoShape(features.minimumAge.customer), ...credentialsShape })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const vendorRegistrationSchema = z
  .object({ ...personalInfoShape(features.minimumAge.vendor), ...credentialsShape })
  .refine(passwordsMatch.check, passwordsMatch.params);

export type CustomerRegistrationInput = z.input<typeof customerRegistrationSchema>;
export type VendorRegistrationInput = z.input<typeof vendorRegistrationSchema>;

/** Field groups per presentation step, used to validate one step at a time. */
export const personalInfoFields = [
  "firstName",
  "lastName",
  "birthdate",
  "contactNumber",
  "email",
] as const;
export const credentialFields = ["password", "confirmPassword"] as const;
