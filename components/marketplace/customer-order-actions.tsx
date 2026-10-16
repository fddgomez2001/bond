"use client";

import { useState, useTransition } from "react";
import { Flag, PackageCheck, Star, XCircle } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea, inputClasses } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { reportReasons, type OrderStatus } from "@/lib/marketplace/constants";
import { customerOrderAction, reportOrder, reviewOrder } from "@/lib/marketplace/customer-actions";
import { cn } from "@/lib/utils";

/** Confirm received / cancel / report, depending on where the order is. */
export function CustomerOrderActions({ orderId, status, isService }: { orderId: string; status: OrderStatus; isService: boolean }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"cancel" | "report" | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string>();

  const canConfirm = status === "delivered";
  const canCancel = status === "awaiting_payment" || status === "paid";
  const canReport = ["ready", "delivery_failed", "delivered"].includes(status);

  function act(action: "cancel" | "confirm_received") {
    setError(undefined);
    startTransition(async () => {
      const result = await customerOrderAction({ orderId, action });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDialog(null);
      toast({ tone: "success", title: action === "cancel" ? "Order cancelled" : "Thanks for confirming!", message: result.message });
    });
  }

  function report() {
    setError(undefined);
    startTransition(async () => {
      const result = await reportOrder({ orderId, reason, details });
      if (!result.ok) {
        setError(result.fieldErrors?.details?.[0] ?? result.message);
        return;
      }
      setDialog(null);
      toast({ tone: "info", title: "Report sent", message: result.message });
    });
  }

  if (!canConfirm && !canCancel && !canReport) return null;

  return (
    <div className="space-y-2">
      {canConfirm && (
        <Button size="lg" onClick={() => act("confirm_received")} loading={pending && !dialog} className="w-full">
          <PackageCheck className="size-5" aria-hidden />
          {isService ? "Confirm the service is done" : "I received it"}
        </Button>
      )}
      {canReport && (
        <Button
          variant="outline"
          onClick={() => {
            setError(undefined);
            setDialog("report");
          }}
          className="w-full"
        >
          <Flag className="size-4" aria-hidden />
          {status === "delivered" ? "Something's wrong" : "Report a problem"}
        </Button>
      )}
      {canCancel && (
        <Button
          variant="ghost"
          onClick={() => {
            setError(undefined);
            setDialog("cancel");
          }}
          className="w-full text-red-700! hover:bg-red-50!"
        >
          <XCircle className="size-4" aria-hidden />
          Cancel order
        </Button>
      )}
      {!dialog && <ErrorMessage message={error} />}

      <Dialog
        open={dialog === "cancel"}
        onClose={() => !pending && setDialog(null)}
        title="Cancel this order?"
        description={status === "paid" ? "You'll get a full refund. The shop hasn't started on it yet." : "You haven't paid, so nothing is charged."}
      >
        <ErrorMessage message={error} className="mb-4" />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
            Keep my order
          </Button>
          <Button onClick={() => act("cancel")} loading={pending} className="bg-red-600! hover:bg-red-700!">
            Cancel order
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "report"}
        onClose={() => !pending && setDialog(null)}
        title="Report a problem"
        description="Your payment stays on hold while BOND looks into it. We'll refund you or pay the shop based on what we find."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            report();
          }}
          className="space-y-4"
        >
          <Field id="report-reason" label="What went wrong?" required>
            <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClasses(false)} required>
              <option value="" disabled>
                Choose a reason
              </option>
              {reportReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="report-details" label="Tell us more" required>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              placeholder="What happened, and when?"
            />
          </Field>
          <ErrorMessage message={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!reason || details.trim().length < 10}>
              Send report
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

/** Star rating + comment after a completed order. */
export function FeedbackForm({ orderId, shopName }: { orderId: string; shopName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const shown = hover || rating;
  const words = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const result = await reviewOrder({ orderId, rating, comment });
          if (!result.ok) {
            setError(result.fieldErrors?.rating?.[0] ?? result.message);
            return;
          }
          toast({ tone: "success", title: "Thank you for using BOND!", message: "Your feedback helps other customers." });
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={pending}>
        <legend className="text-sm font-semibold text-bond-ink">How was {shopName}?</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-bond-slate" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <Star
                className={cn(
                  "size-9 transition-all duration-300 ease-spring",
                  n <= shown ? "scale-110 fill-bond-gold text-bond-gold" : "text-bond-ink/20",
                )}
                aria-hidden
              />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
            </label>
          ))}
          <span className="ml-2 text-sm font-semibold text-bond-ink/70" aria-live="polite">
            {words[shown]}
          </span>
        </div>
      </fieldset>
      <Field id="feedback-comment" label="Comments (optional)">
        <Textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          disabled={pending}
          placeholder="What did you love? What could be better?"
          className="min-h-20"
        />
      </Field>
      <ErrorMessage message={error} />
      <Button type="submit" loading={pending} disabled={rating === 0} className="w-full">
        Send feedback
      </Button>
    </form>
  );
}
