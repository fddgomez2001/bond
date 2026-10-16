"use client";

import { useState, useTransition } from "react";
import { CircleCheckBig, RotateCcw, XCircle } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { reviewVendorApplication } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

type Decision = "approved" | "needs_resubmission" | "rejected";

const options: {
  value: Decision;
  label: string;
  description: string;
  icon: typeof CircleCheckBig;
  selected: string;
  button: string;
  cta: string;
}[] = [
  {
    value: "approved",
    label: "Approve",
    description: "Documents are valid. Unlock vendor tools.",
    icon: CircleCheckBig,
    selected: "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100",
    button: "bg-emerald-600! hover:bg-emerald-700!",
    cta: "Approve vendor",
  },
  {
    value: "needs_resubmission",
    label: "Request resubmission",
    description: "Something is unclear or missing.",
    icon: RotateCcw,
    selected: "border-orange-500 bg-orange-50 ring-4 ring-orange-100",
    button: "bg-orange-600! hover:bg-orange-700!",
    cta: "Request resubmission",
  },
  {
    value: "rejected",
    label: "Reject",
    description: "The application can't be accepted.",
    icon: XCircle,
    selected: "border-red-500 bg-red-50 ring-4 ring-red-100",
    button: "bg-red-600! hover:bg-red-700!",
    cta: "Reject application",
  },
];

export function ReviewForm({ applicationId }: { applicationId: string }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();
  const [notesError, setNotesError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const selected = options.find((o) => o.value === decision);

  function submit() {
    if (!decision) return;
    setError(undefined);
    setNotesError(undefined);
    startTransition(async () => {
      const result = await reviewVendorApplication({ applicationId, decision, notes });
      // Success redirects back to the queue with a toast.
      if (result && !result.ok) {
        setError(result.message);
        setNotesError(result.fieldErrors?.notes?.[0]);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      <fieldset disabled={pending} className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-bond-ink">Decision</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 transition-all duration-300 ease-smooth",
              "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
              decision === option.value ? option.selected : "border-bond-ink/12 hover:border-bond-slate/30 hover:bg-bond-paper",
            )}
          >
            <input
              type="radio"
              name="decision"
              value={option.value}
              checked={decision === option.value}
              onChange={() => setDecision(option.value)}
              className="sr-only"
            />
            <option.icon
              className={cn(
                "mt-0.5 size-5 shrink-0 transition-transform duration-300 ease-spring",
                decision === option.value ? "scale-110" : "text-bond-ink/40",
              )}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-semibold text-bond-ink">{option.label}</span>
              <span className="block text-xs text-bond-ink/60">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Field
        id="review-notes"
        label={decision === "approved" ? "Notes (optional)" : "Notes for the vendor"}
        error={notesError}
        hint="The vendor sees these notes on their dashboard."
        required={decision !== null && decision !== "approved"}
      >
        <Textarea
          id="review-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          disabled={pending}
          invalid={Boolean(notesError)}
          placeholder={
            decision === "approved"
              ? "Anything the vendor should know (optional)"
              : "e.g. The government ID photo is blurry — please upload a clearer copy."
          }
        />
      </Field>

      <ErrorMessage message={error} />

      <Button
        type="submit"
        size="lg"
        disabled={!decision}
        loading={pending}
        loadingText="Saving decision…"
        className={cn("w-full transition-all duration-300 ease-smooth active:scale-[0.99]", selected?.button)}
      >
        {selected?.cta ?? "Choose a decision"}
      </Button>
    </form>
  );
}
