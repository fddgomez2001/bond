"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LegalAgreement } from "@/components/legal/legal-agreement";
import { features } from "@/lib/config/features";
import { customerRegistrationSchema, personalInfoFields } from "@/lib/validations/registration";
import { AuthFormHeader, AuthShell, AuthAsideIntro } from "./auth-shell";
import { DocumentUpload } from "./document-upload";
import { CredentialFields, PersonalInfoFields, UploadProgress } from "./registration-fields";
import { RegistrationStepper, customerSteps } from "./registration-stepper";
import { useRegistration } from "./use-registration";
import { cn } from "@/lib/utils";

const governmentIdRule = features.customerGovernmentId;
const stepOfField = (field: string) =>
  (personalInfoFields as readonly string[]).includes(field) || field === "government_id" ? 0 : 1;

export function CustomerRegistrationForm({ configured }: { configured: boolean }) {
  const { form, step, direction, setStep, progress, busy, serverError, fileErrors, setFileErrors, submit } =
    useRegistration({
      schema: customerRegistrationSchema,
      endpoint: "/api/auth/register/customer",
      stepOfField,
    });
  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = form;
  const password = useWatch({ control, name: "password" }) ?? "";
  const [governmentId, setGovernmentId] = useState<File | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  async function goToCredentials() {
    const fieldsValid = await trigger([...personalInfoFields]);
    const idMissing = governmentIdRule === "required" && !governmentId;
    setFileErrors(idMissing ? { government_id: "Valid Government ID is required" } : {});
    if (fieldsValid && !idMissing) setStep(1);
  }

  const onSubmit = handleSubmit((values) =>
    submit(values, governmentIdRule === "off" ? {} : { government_id: governmentId }),
  );

  const current = customerSteps[step];

  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Customer sign-up" title="Join BOND" />
          <RegistrationStepper steps={customerSteps} current={step} />
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          // Enter on step 1 should advance, not submit.
          if (step === 0) {
            event.preventDefault();
            void goToCredentials();
            return;
          }
          void onSubmit(event);
        }}
        noValidate
        className="space-y-6"
      >
        <div
          key={step}
          className={cn("space-y-6", direction === "back" ? "animate-step-back" : "animate-step-next")}
        >
          <div ref={headingRef} tabIndex={-1} className="outline-none">
            <AuthFormHeader
              title={current.title}
              description={
                step === 0
                  ? "Please provide your name, birthdate, contact number, and email address."
                  : "Create a password to keep your account secure."
              }
            />
          </div>

          {!configured && (
            <Alert tone="warning" title="Supabase not connected">
              You can fill in the form, but accounts can&apos;t be created until the Supabase keys are added to{" "}
              <code>.env.local</code>.
            </Alert>
          )}
          <ErrorMessage message={serverError} />

          {step === 0 && (
            <div className="space-y-5">
              <PersonalInfoFields register={register} errors={errors} />
              {governmentIdRule !== "off" && (
                <DocumentUpload
                  type="government_id"
                  file={governmentId}
                  onChange={(file) => {
                    setGovernmentId(file);
                    setFileErrors({});
                  }}
                  error={fileErrors.government_id}
                  required={governmentIdRule === "required"}
                />
              )}
            </div>
          )}

          {step === 1 && <CredentialFields register={register} errors={errors} password={password} disabled={busy} />}
        </div>

        {progress !== null && <UploadProgress percent={progress} hasFiles={Boolean(governmentId)} />}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {step === 0 ? (
            <Link href="/signup" className="text-center text-sm font-semibold text-bond-slate hover:underline">
              Choose a different account type
            </Link>
          ) : (
            <Button variant="ghost" onClick={() => setStep(0)} disabled={busy}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          )}

          {step === 0 ? (
            <Button type="submit" size="lg">
              Next step <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={busy} loadingText="Creating account…">
              Create account
            </Button>
          )}
        </div>

        <LegalAgreement prefix="By creating an account you agree to the" />
      </form>
    </AuthShell>
  );
}
