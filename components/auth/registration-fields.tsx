"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field, Input, describedBy } from "@/components/ui/field";
import { siteConfig } from "@/lib/config/site";
import type { CustomerRegistrationInput } from "@/lib/validations/registration";
import { PasswordInput, PasswordRequirements } from "./password-input";

/** Customer and vendor forms share the same personal + credential fields. */
export type RegistrationValues = CustomerRegistrationInput;

type FieldProps = {
  register: UseFormRegister<RegistrationValues>;
  errors: FieldErrors<RegistrationValues>;
  disabled?: boolean;
};

export function PersonalInfoFields({ register, errors, disabled }: FieldProps) {
  return (
    <fieldset disabled={disabled} className="grid gap-5 sm:grid-cols-2">
      <legend className="sr-only">Personal information</legend>
      <Field id="firstName" label="First name" error={errors.firstName?.message} required>
        <Input
          id="firstName"
          autoComplete="given-name"
          placeholder="e.g. Maria"
          invalid={Boolean(errors.firstName)}
          aria-describedby={describedBy("firstName", errors.firstName?.message)}
          {...register("firstName")}
        />
      </Field>
      <Field id="lastName" label="Last name" error={errors.lastName?.message} required>
        <Input
          id="lastName"
          autoComplete="family-name"
          placeholder="e.g. Santos"
          invalid={Boolean(errors.lastName)}
          aria-describedby={describedBy("lastName", errors.lastName?.message)}
          {...register("lastName")}
        />
      </Field>
      <Field id="birthdate" label="Birthdate" error={errors.birthdate?.message} required>
        <Input
          id="birthdate"
          type="date"
          autoComplete="bday"
          invalid={Boolean(errors.birthdate)}
          aria-describedby={describedBy("birthdate", errors.birthdate?.message)}
          {...register("birthdate")}
        />
      </Field>
      <Field
        id="contactNumber"
        label="Contact number"
        error={errors.contactNumber?.message}
        hint="Mobile or landline. Add the country code for non-local numbers."
        required
      >
        <Input
          id="contactNumber"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder={siteConfig.phonePlaceholder}
          invalid={Boolean(errors.contactNumber)}
          aria-describedby={describedBy("contactNumber", errors.contactNumber?.message, true)}
          {...register("contactNumber")}
        />
      </Field>
      <Field id="email" label="Email address" error={errors.email?.message} className="sm:col-span-2" required>
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
    </fieldset>
  );
}

export function CredentialFields({ register, errors, disabled, password }: FieldProps & { password: string }) {
  return (
    <fieldset disabled={disabled} className="space-y-5">
      <legend className="sr-only">Account credentials</legend>
      <Field id="password" label="Password" error={errors.password?.message} required>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Create a password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-rules"}
          {...register("password")}
        />
      </Field>
      <PasswordRequirements id="password-rules" password={password} />
      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message} required>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Type it again"
          invalid={Boolean(errors.confirmPassword)}
          aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
          {...register("confirmPassword")}
        />
      </Field>
    </fieldset>
  );
}

export function UploadProgress({ percent, hasFiles }: { percent: number; hasFiles: boolean }) {
  const label =
    percent < 100 ? (hasFiles ? "Uploading your documents…" : "Sending your details…") : "Creating your account…";
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <div className="flex justify-between text-xs font-medium text-bond-ink/70">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-bond-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Upload progress"
      >
        <div className="h-full rounded-full bg-bond-slate transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export const defaultRegistrationValues: RegistrationValues = {
  firstName: "",
  lastName: "",
  birthdate: "",
  contactNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};
