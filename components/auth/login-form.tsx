"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { signIn } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/validations/auth";
import { PasswordInput } from "./password-input";

type Values = z.input<typeof loginSchema>;

const notices: Record<string, { tone: "success" | "info" | "error"; text: string }> = {
  "signed-out": { tone: "info", text: "You've been signed out." },
  "password-updated": { tone: "success", text: "Password updated. Log in with your new password." },
  "session-expired": { tone: "info", text: "Your session expired. Please log in again." },
};

export function LoginForm({
  next,
  status,
  configured,
}: {
  next?: string;
  status?: string;
  configured: boolean;
}) {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined);
    const result = await signIn(values, next);
    // A successful sign-in redirects on the server, so only failures return here.
    if (result && !result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof Values, { message: messages[0] });
      }
      setServerError(result.message);
    }
  });

  const notice = status ? notices[status] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {!configured && (
        <Alert tone="warning" title="Supabase not connected">
          Add your Supabase keys to <code>.env.local</code> to enable login. The form still validates
          locally.
        </Alert>
      )}
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <ErrorMessage message={serverError} />

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

      <Field id="password" label="Password" error={errors.password?.message} required>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Your password"
          invalid={Boolean(errors.password)}
          aria-describedby={describedBy("password", errors.password?.message)}
          {...register("password")}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 text-bond-ink/80">
          <input
            type="checkbox"
            className="size-4 rounded border-bond-ink/30 accent-bond-slate"
            {...register("remember")}
          />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="font-semibold text-bond-slate underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Logging in…">
        Log in
      </Button>

      <p className="text-center text-sm text-bond-ink/70">
        New to BOND?{" "}
        <Link href="/signup" className="font-semibold text-bond-slate underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
