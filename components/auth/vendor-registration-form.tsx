"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LegalAgreement } from "@/components/legal/legal-agreement";
import { MAX_TOTAL_UPLOAD_BYTES, documentTypes, formatBytes, type DocumentType } from "@/lib/config/uploads";
import { personalInfoFields, vendorRegistrationSchema } from "@/lib/validations/registration";
import { AuthAsideIntro, AuthFormHeader, AuthShell } from "./auth-shell";
import { DocumentUpload } from "./document-upload";
import { CredentialFields, PersonalInfoFields, UploadProgress } from "./registration-fields";
import { RegistrationStepper, vendorSteps } from "./registration-stepper";
import { useRegistration } from "./use-registration";
import { cn } from "@/lib/utils";

const DOCUMENTS: DocumentType[] = ["selfie", "government_id", "proof_of_business"];

const stepOfField = (field: string) => {
  if ((personalInfoFields as readonly string[]).includes(field)) return 0;
  if ((DOCUMENTS as string[]).includes(field)) return 1;
  return 2;
};

const descriptions = [
  "Please provide your name, birthdate, contact number, and email address.",
  "Upload the documents we need to review your vendor application. They're stored privately.",
  "Create a password to keep your account secure.",
];

export function VendorRegistrationForm({ configured }: { configured: boolean }) {
  const { form, step, direction, setStep, progress, busy, serverError, setServerError, fileErrors, setFileErrors, submit } =
    useRegistration({
      schema: vendorRegistrationSchema,
      endpoint: "/api/auth/register/vendor",
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
  const [files, setFiles] = useState<Record<DocumentType, File | null>>({
    selfie: null,
    government_id: null,
    proof_of_business: null,
  });

  const headingRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  async function next() {
    if (step === 0) {
      if (await trigger([...personalInfoFields])) setStep(1);
      return;
    }
    if (step === 1) {
      const missing: Partial<Record<DocumentType, string>> = {};
      for (const type of DOCUMENTS) {
        if (!files[type]) missing[type] = `${documentTypes[type].label} is required`;
      }
      setFileErrors(missing);
      if (Object.keys(missing).length > 0) return;

      const total = DOCUMENTS.reduce((sum, type) => sum + (files[type]?.size ?? 0), 0);
      if (total > MAX_TOTAL_UPLOAD_BYTES) {
        setServerError(
          `Your documents add up to ${formatBytes(total)}. Keep the total under ${formatBytes(MAX_TOTAL_UPLOAD_BYTES)} — try smaller photos or a lighter PDF.`,
        );
        return;
      }
      setServerError(undefined);
      setStep(2);
    }
  }

  const onSubmit = handleSubmit((values) => submit(values, files));

  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Vendor registration" title="Grow with BOND" />
          <RegistrationStepper steps={vendorSteps} current={step} />
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          if (step < 2) {
            event.preventDefault();
            void next();
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
            <AuthFormHeader title={vendorSteps[step].title} description={descriptions[step]} />
          </div>

          {!configured && (
            <Alert tone="warning" title="Supabase not connected">
              You can fill in the form, but vendor accounts can&apos;t be created until the Supabase keys
              (including the server-only service role key) are added to <code>.env.local</code>.
            </Alert>
          )}
          <ErrorMessage message={serverError} />

          {step === 0 && <PersonalInfoFields register={register} errors={errors} />}

          {step === 1 && (
            <div className="space-y-6">
              <Alert tone="info">
                <span className="inline-flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Documents are stored in a private bucket and are only visible to you and the BOND review
                  team. Images are resized and their location data removed before upload.
                </span>
              </Alert>
              {DOCUMENTS.map((type) => (
                <DocumentUpload
                  key={type}
                  type={type}
                  file={files[type]}
                  onChange={(file) => {
                    setFiles((current) => ({ ...current, [type]: file }));
                    setFileErrors((current) => ({ ...current, [type]: undefined }));
                  }}
                  error={fileErrors[type]}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <CredentialFields register={register} errors={errors} password={password} disabled={busy} />
          )}
        </div>

        {progress !== null && <UploadProgress percent={progress} hasFiles />}

        {step === 2 && !busy && (
          <p className="text-sm text-bond-ink/65">
            After you verify your email, your application goes to <strong>review</strong>. Vendor tools
            unlock once your documents are approved.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {step === 0 ? (
            <Link href="/signup" className="text-center text-sm font-semibold text-bond-slate hover:underline">
              Choose a different account type
            </Link>
          ) : (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          )}

          {step < 2 ? (
            <Button type="submit" size="lg">
              Next step <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={busy} loadingText="Submitting…">
              Submit registration
            </Button>
          )}
        </div>

        <LegalAgreement prefix="By registering you agree to the" />
      </form>
    </AuthShell>
  );
}
