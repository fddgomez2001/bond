"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { DocumentType } from "@/lib/config/uploads";
import { postFormWithProgress } from "@/lib/uploads/post-form";
import type { customerRegistrationSchema } from "@/lib/validations/registration";
import { defaultRegistrationValues, type RegistrationValues } from "./registration-fields";

type Schema = typeof customerRegistrationSchema;
type Output = z.output<Schema>;
type Files = Partial<Record<DocumentType, File | null>>;

/**
 * Form state, step navigation and submission shared by the customer and
 * vendor sign-up forms. Submission goes to a Route Handler (not a Server
 * Action) so the browser can report upload progress.
 */
export function useRegistration({
  schema,
  endpoint,
  stepOfField,
}: {
  schema: Schema;
  endpoint: string;
  stepOfField: (field: string) => number;
}) {
  const form = useForm<RegistrationValues, unknown, Output>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: defaultRegistrationValues,
  });
  const [{ step, direction }, setNav] = useState<{ step: number; direction: "next" | "back" }>({
    step: 0,
    direction: "next",
  });
  // Remember which way the user moved so the step can slide in from that side.
  const setStep = (next: number) =>
    setNav((current) => ({ step: next, direction: next >= current.step ? "next" : "back" }));
  const [progress, setProgress] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string>();
  const [fileErrors, setFileErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const inFlight = useRef(false);

  async function submit(values: Output, files: Files) {
    // Guards against double submits even before React re-renders.
    if (inFlight.current) return;
    inFlight.current = true;
    setServerError(undefined);
    setProgress(0);

    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, value);
    for (const [type, file] of Object.entries(files)) if (file) body.append(type, file);

    const result = await postFormWithProgress(endpoint, body, setProgress);

    if (result.ok) {
      // Full navigation so the new auth cookies are read fresh by the server.
      window.location.assign(result.redirectTo);
      return;
    }

    inFlight.current = false;
    setProgress(null);
    setServerError(result.message);

    const fieldErrors = Object.entries(result.fieldErrors ?? {});
    const nextFileErrors: Partial<Record<DocumentType, string>> = {};
    let firstStep: number | null = null;
    for (const [field, messages] of fieldErrors) {
      const message = messages?.[0];
      if (!message) continue;
      if (field in defaultRegistrationValues) {
        form.setError(field as keyof RegistrationValues, { message });
      } else {
        nextFileErrors[field as DocumentType] = message;
      }
      const fieldStep = stepOfField(field);
      firstStep = firstStep === null ? fieldStep : Math.min(firstStep, fieldStep);
    }
    setFileErrors(nextFileErrors);
    if (firstStep !== null) setStep(firstStep);
  }

  return {
    form,
    step,
    direction,
    setStep,
    progress,
    busy: progress !== null,
    serverError,
    setServerError,
    fileErrors,
    setFileErrors,
    submit,
  };
}
