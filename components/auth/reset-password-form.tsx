"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CircleCheckBig } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, describedBy } from "@/components/ui/field";
import { updatePassword } from "@/lib/auth/actions";
import { newPasswordSchema } from "@/lib/validations/password";
import { AuthFormHeader } from "./auth-shell";
import { PasswordInput, PasswordRequirements } from "./password-input";

type Values = z.input<typeof newPasswordSchema>;

export function ResetPasswordForm({ preview }: { preview: boolean }) {
  const [serverError, setServerError] = useState<string>();
  const [previewDone, setPreviewDone] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, z.output<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined);
    if (preview) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPreviewDone(true);
      return;
    }
    const result = await updatePassword(values);
    // Success signs the user out and redirects to /login.
    if (result && !result.ok) setServerError(result.message);
  });

  if (previewDone) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CircleCheckBig className="size-7" aria-hidden />
        </span>
        <AuthFormHeader
          title="Preview complete"
          description="This is where you'd be sent back to log in with your new password. Because password recovery isn't enabled yet, your password has not been changed."
        />
        <Link href="/login" className={buttonClasses({ size: "lg", className: "w-full" })}>
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <AuthFormHeader title="Create a new password" description="Choose a strong password you haven't used before." />
      {preview && (
        <Alert tone="warning" title="Preview mode">
          Password recovery isn&apos;t enabled yet, so submitting won&apos;t change any password.
        </Alert>
      )}
      <ErrorMessage message={serverError} />

      <Field id="password" label="New password" error={errors.password?.message} required>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-rules"}
          {...register("password")}
        />
      </Field>
      <PasswordRequirements id="password-rules" password={password} />
      <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message} required>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
          {...register("confirmPassword")}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Saving…">
        Update password
      </Button>
    </form>
  );
}
