"use client";

import { useState, useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { bookingAppointment } from "@/lib/marketplace/customer-actions";

/**
 * After paying for an event: "Book an appointment with your organizer?"
 * Book → pick a time; Later → skip (organizers can still contact you).
 */
export function AppointmentPrompt({ bookingId, minLocal, maxLocal }: { bookingId: string; minLocal: string; maxLocal: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"request" | "skip" | null>(null);

  function send(action: "request" | "skip") {
    setError(undefined);
    setBusy(action);
    startTransition(async () => {
      const result =
        action === "skip" ? await bookingAppointment({ bookingId, action }) : await bookingAppointment({ bookingId, action, at, note: note || undefined });
      setBusy(null);
      if (!result.ok) {
        setError(result.fieldErrors?.at?.[0] ?? result.message);
        return;
      }
      toast({ tone: "success", title: action === "skip" ? "Got it" : "Appointment requested", message: result.message });
    });
  }

  return (
    <section className="rounded-3xl border-2 border-bond-yellow bg-bond-cream/70 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-bond-yellow text-bond-slate">
          <CalendarCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-bond-ink">Book an appointment with your organizer?</h2>
          <p className="text-sm text-bond-ink/70">
            Meet or call to go over the details — theme, program, menu, timeline. You can skip this and they&apos;ll still have
            everything they need.
          </p>
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-smooth ${open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden" inert={!open}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="appointment-at" label="Preferred date & time" required>
              <Input id="appointment-at" type="datetime-local" min={minLocal} max={maxLocal} value={at} onChange={(e) => setAt(e.target.value)} />
            </Field>
            <Field id="appointment-note" label="What would you like to discuss? (optional)">
              <Textarea id="appointment-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-12" />
            </Field>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} className="mt-4" />

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {open ? (
          <Button onClick={() => send("request")} loading={busy === "request"} disabled={pending || !at} className="sm:flex-1">
            Request appointment
          </Button>
        ) : (
          <Button onClick={() => setOpen(true)} className="sm:flex-1">
            Book an appointment
          </Button>
        )}
        <Button variant="outline" onClick={() => send("skip")} loading={busy === "skip"} disabled={pending} className="sm:flex-1">
          Maybe later
        </Button>
      </div>
    </section>
  );
}
