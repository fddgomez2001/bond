"use client";

import { useState, useTransition } from "react";
import { CircleCheckBig, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { reviewListing } from "@/lib/admin/marketplace-actions";
import type { ListingStatus } from "@/types/marketplace";

/** Approve straight away, or reject with notes the vendor will read. */
export function ListingReviewActions({ listingId, title, status }: { listingId: string; title: string; status: ListingStatus }) {
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();

  function submit(next: "approved" | "rejected") {
    setError(undefined);
    setDecision(next);
    startTransition(async () => {
      const result = await reviewListing({ listingId, decision: next, notes: next === "rejected" ? notes : "" });
      if (!result.ok) {
        setError(result.fieldErrors?.notes?.[0] ?? result.message);
        if (next === "approved") toast({ tone: "error", title: "Couldn't approve", message: result.message });
        return;
      }
      setRejecting(false);
      setNotes("");
      toast({ tone: next === "approved" ? "success" : "info", title: next === "approved" ? "Listing approved" : "Listing rejected", message: result.message });
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        {status !== "approved" && (
          <Button
            onClick={() => submit("approved")}
            loading={pending && decision === "approved"}
            disabled={pending}
            className="flex-1 bg-emerald-600! hover:bg-emerald-700!"
          >
            <CircleCheckBig className="size-4" aria-hidden />
            Approve
            <span className="sr-only"> {title}</span>
          </Button>
        )}
        {status !== "rejected" && (
          <Button variant="outline" onClick={() => setRejecting(true)} disabled={pending} className="flex-1 border-red-200! text-red-700! hover:bg-red-50!">
            <XCircle className="size-4" aria-hidden />
            {status === "approved" ? "Unpublish" : "Reject"}
            <span className="sr-only"> {title}</span>
          </Button>
        )}
      </div>

      <Dialog
        open={rejecting}
        onClose={() => !pending && setRejecting(false)}
        title={status === "approved" ? `Unpublish “${title}”?` : `Reject “${title}”?`}
        description="The vendor sees your notes and can fix the listing and resubmit it."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit("rejected");
          }}
          className="space-y-4"
        >
          <Field id={`notes-${listingId}`} label="What should the vendor change?" required error={error}>
            <Textarea
              id={`notes-${listingId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              disabled={pending}
              invalid={Boolean(error)}
              placeholder="e.g. The photo is blurry and the price doesn't match the description."
              autoFocus
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRejecting(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={pending && decision === "rejected"}
              disabled={notes.trim().length < 5}
              className="bg-red-600! hover:bg-red-700!"
            >
              {status === "approved" ? "Unpublish" : "Reject listing"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
