"use client";

import { useState, useTransition } from "react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import type { VendorAction } from "@/lib/marketplace/constants";
import { vendorOrderAction } from "@/lib/marketplace/vendor-actions";

type ActionOption = { action: VendorAction; label: string; tone: "primary" | "secondary" | "danger" };

/** Actions that ask for a note first; the customer sees it on their order. */
const notePrompts: Partial<Record<VendorAction, { title: string; description: string; label: string; required: boolean; cta: string }>> = {
  decline: {
    title: "Decline this order?",
    description: "The customer is refunded in full. Tell them why so they can order elsewhere.",
    label: "Reason for declining",
    required: true,
    cta: "Decline & refund",
  },
  delivery_failed: {
    title: "Delivery didn't go through",
    description: "Let the customer know what happened. You can try delivering again afterwards.",
    label: "What happened?",
    required: false,
    cta: "Notify the customer",
  },
  confirm: {
    title: "Confirm this booking",
    description: "Optionally add a note about the appointment or next steps — the customer sees it.",
    label: "Note for the customer (optional)",
    required: false,
    cta: "Confirm booking",
  },
};

export function VendorOrderActions({ orderId, actions }: { orderId: string; actions: ActionOption[] }) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<VendorAction | null>(null);
  const [prompt, setPrompt] = useState<VendorAction | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  function run(action: VendorAction, withNote?: string) {
    setError(undefined);
    setRunning(action);
    startTransition(async () => {
      const result = await vendorOrderAction({ orderId, action, note: withNote || undefined });
      setRunning(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPrompt(null);
      setNote("");
      toast({ tone: "success", title: "Order updated", message: result.message });
    });
  }

  const active = prompt ? notePrompts[prompt] : null;
  const noteTooShort = Boolean(active?.required && note.trim().length < 5);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {actions.map((option) => (
          <Button
            key={option.action}
            size="lg"
            variant={option.tone === "primary" ? "primary" : "outline"}
            loading={pending && running === option.action}
            disabled={pending}
            onClick={() => (notePrompts[option.action] ? setPrompt(option.action) : run(option.action))}
            className={
              option.tone === "danger"
                ? "w-full border-red-200! text-red-700! hover:bg-red-50!"
                : "w-full transition-all duration-300 ease-smooth active:scale-[0.99]"
            }
          >
            {option.label}
          </Button>
        ))}
      </div>
      {!prompt && <ErrorMessage message={error} />}

      <Dialog
        open={Boolean(prompt)}
        onClose={() => !pending && setPrompt(null)}
        title={active?.title ?? ""}
        description={active?.description}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (prompt && !noteTooShort) run(prompt, note.trim());
          }}
          className="space-y-4"
        >
          <Field id="vendor-action-note" label={active?.label ?? "Note"} required={active?.required}>
            <Textarea
              id="vendor-action-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              disabled={pending}
              autoFocus
            />
          </Field>
          <ErrorMessage message={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPrompt(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={pending}
              disabled={noteTooShort}
              className={prompt === "decline" ? "bg-red-600! hover:bg-red-700!" : undefined}
            >
              {active?.cta}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
