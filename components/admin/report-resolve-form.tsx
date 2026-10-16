"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, RotateCcw } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { resolveReport } from "@/lib/admin/marketplace-actions";
import { cn } from "@/lib/utils";

const options = [
  {
    value: "refund" as const,
    label: "Refund the customer",
    description: "The order is cancelled and the held payment goes back to the customer.",
    icon: RotateCcw,
    selected: "border-red-500 bg-red-50 ring-4 ring-red-100",
  },
  {
    value: "release" as const,
    label: "Release to the shop",
    description: "The order is completed and the shop is paid.",
    icon: BadgeCheck,
    selected: "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100",
  },
];

export function ReportResolveForm({ reportId }: { reportId: string }) {
  const [resolution, setResolution] = useState<"refund" | "release" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [noteError, setNoteError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!resolution) return;
        setError(undefined);
        setNoteError(undefined);
        startTransition(async () => {
          const result = await resolveReport({ reportId, resolution, note });
          if (!result.ok) {
            setError(result.message);
            setNoteError(result.fieldErrors?.note?.[0]);
            return;
          }
          toast({ tone: "success", title: "Report resolved", message: result.message });
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={pending} className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-bond-ink">Decision</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-3 transition-all duration-300 ease-smooth",
              "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
              resolution === option.value ? option.selected : "border-bond-ink/12 hover:border-bond-slate/30",
            )}
          >
            <input
              type="radio"
              name={`resolution-${reportId}`}
              className="sr-only"
              checked={resolution === option.value}
              onChange={() => setResolution(option.value)}
            />
            <option.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-bond-ink">{option.label}</span>
              <span className="block text-xs text-bond-ink/60">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Field id={`resolve-note-${reportId}`} label="Note (both the customer and shop see it)" required error={noteError}>
        <Textarea
          id={`resolve-note-${reportId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          disabled={pending}
          invalid={Boolean(noteError)}
          className="min-h-20"
          placeholder="e.g. The shop confirmed the delivery was missed. Refunding in full."
        />
      </Field>
      <ErrorMessage message={error && !noteError ? error : undefined} />
      <Button type="submit" loading={pending} loadingText="Saving…" disabled={!resolution || note.trim().length < 5} className="w-full">
        Resolve report
      </Button>
    </form>
  );
}
