"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, Check, MapPin, MessageSquareHeart, PartyPopper, ShieldCheck, UserRound } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { formatDateTime, formatPeso } from "@/lib/format";
import { surpriseSteps, toPhIso } from "@/lib/marketplace/constants";
import { placeSurpriseOrder } from "@/lib/marketplace/customer-actions";
import { cn } from "@/lib/utils";
import type { FormState } from "@/types/auth";
import type { FlowOption } from "@/types/marketplace";
import { EmptyState, ListingImage, WizardSteps } from "./bits";
import { DeliveryFields, firstErrors, type DeliveryFieldsValues } from "./checkout-form";

type Values = DeliveryFieldsValues & { scheduledFor: string; listingId: string };

const digits = (v: string) => v.replace(/\D/g, "").length;

/** Which step each server-side field error belongs to. */
const fieldStep: Record<string, number> = {
  scheduledFor: 0,
  recipientName: 0,
  recipientPhone: 0,
  address: 0,
  giftMessage: 0,
  notes: 0,
  listingId: 1,
};

/**
 * Surprise flow: when + who → pick a surprise (only available ones are
 * listed) → review → book & pay. The recipient's details are collected
 * because the shop has to call them before the surprise.
 */
export function SurpriseWizard({ options, minLocal, initialListing }: { options: FlowOption[]; minLocal: string; initialListing: string | null }) {
  const [step, setStep] = useState(0);
  // Only animate after the first step change (the page itself already fades in).
  const [moved, setMoved] = useState(false);
  const [values, setValues] = useState<Values>({
    scheduledFor: "",
    recipientName: "",
    recipientPhone: "",
    address: "",
    giftMessage: "",
    notes: "",
    listingId: initialListing ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverState, setServerState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();
  const chosen = options.find((o) => o.id === values.listingId) ?? null;
  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function go(next: number) {
    setMoved(true);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep(index: number) {
    const e: Record<string, string> = {};
    if (index === 0) {
      if (!values.scheduledFor) e.scheduledFor = "Choose a date and time";
      else if (values.scheduledFor < minLocal) e.scheduledFor = "Choose a time at least 3 hours from now";
      if (values.recipientName.trim().length < 2) e.recipientName = "Who is the surprise for?";
      if (digits(values.recipientPhone) < 7 || digits(values.recipientPhone) > 15) e.recipientPhone = "Enter a contact number (7–15 digits)";
      if (values.address.trim().length < 5) e.address = "Where should the surprise happen?";
    }
    if (index === 1 && !chosen) e.listingId = "Choose a surprise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    setServerState(null);
    startTransition(async () => {
      // Success redirects to the payment page.
      const result = await placeSurpriseOrder(values);
      if (result && !result.ok) {
        setServerState(result);
        const fieldErrors = firstErrors(result);
        setErrors(fieldErrors);
        const firstStep = Math.min(...Object.keys(fieldErrors).map((k) => fieldStep[k] ?? 2));
        if (firstStep < 2) go(firstStep);
      }
    });
  }

  const total = chosen ? chosen.price + chosen.shop.delivery_fee : 0;

  return (
    <div className="space-y-6">
      <WizardSteps steps={surpriseSteps} current={step} />

      <div key={step} className={moved ? "animate-[fade-up_0.45s_var(--ease-smooth)_both]" : undefined}>
        {step === 0 && (
          <section className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-bond-ink">When and who?</h2>
              <p className="text-sm text-bond-ink/60">Times are in Philippine time. Book at least 3 hours ahead.</p>
            </div>
            <Field id="surprise-when" label="Date & time of the surprise" required error={errors.scheduledFor}>
              <Input
                id="surprise-when"
                type="datetime-local"
                min={minLocal}
                value={values.scheduledFor}
                onChange={(e) => set("scheduledFor", e.target.value)}
                invalid={Boolean(errors.scheduledFor)}
                aria-describedby={describedBy("surprise-when", errors.scheduledFor)}
                className="sm:max-w-xs"
              />
            </Field>
            <DeliveryFields idPrefix="surprise" values={values} onChange={set} errors={errors} />
          </section>
        )}

        {step === 1 &&
          (options.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title="No surprises available right now"
              action={
                <Link href="/shops?offer=surprise" className={buttonClasses({ variant: "gold" })}>
                  Browse shops
                </Link>
              }
            >
              Shops are still adding surprises. Your details are saved while this tab stays open.
            </EmptyState>
          ) : (
            <fieldset>
              <legend className="mb-1 font-heading text-lg font-bold text-bond-ink">Choose a surprise</legend>
              <p className="mb-4 text-sm text-bond-ink/60">Only surprises that are available to book are shown.</p>
              {errors.listingId && (
                <p role="alert" className="mb-3 text-sm font-medium text-red-600">
                  {errors.listingId}
                </p>
              )}
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {options.map((option) => {
                  const selected = option.id === values.listingId;
                  return (
                    <li key={option.id}>
                      <label
                        className={cn(
                          "group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-[var(--shadow-card)] transition-all duration-300 ease-smooth",
                          "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                          selected ? "border-bond-slate ring-4 ring-bond-yellow/50" : "border-bond-ink/8 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
                        )}
                      >
                        <input
                          type="radio"
                          name="surprise"
                          className="sr-only"
                          checked={selected}
                          onChange={() => set("listingId", option.id)}
                        />
                        <div className="relative">
                          <ListingImage path={option.image_path} kind="surprise" alt="" className="aspect-[16/10]" />
                          <span
                            className={cn(
                              "absolute top-3 right-3 flex size-8 items-center justify-center rounded-full border-2 border-white transition-all duration-300 ease-spring",
                              selected ? "scale-100 bg-bond-slate text-white" : "scale-90 bg-white/70 text-transparent",
                            )}
                            aria-hidden
                          >
                            <Check className="size-4" />
                          </span>
                        </div>
                        <span className="flex flex-1 flex-col p-4">
                          <span className="font-heading font-semibold text-bond-ink">{option.title}</span>
                          <span className="text-xs text-bond-ink/55">
                            {option.shop.name}
                            {option.shop.city && ` · ${option.shop.city}`}
                          </span>
                          <span className="mt-1 line-clamp-2 text-sm text-bond-ink/65">{option.description}</span>
                          <span className="mt-auto pt-2 font-heading font-bold text-bond-slate">{formatPeso(option.price)}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}

        {step === 2 && chosen && (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-2">
              <h2 className="font-heading text-lg font-bold text-bond-ink">Review your surprise</h2>
              <ul className="space-y-3 text-sm">
                <Summary icon={CalendarClock} label="When">
                  {formatDateTime(toPhIso(values.scheduledFor))}
                </Summary>
                <Summary icon={UserRound} label="For">
                  {values.recipientName} · {values.recipientPhone}
                </Summary>
                <Summary icon={MapPin} label="Where">
                  {values.address}
                </Summary>
                {values.giftMessage && (
                  <Summary icon={MessageSquareHeart} label="Message">
                    <span className="italic">“{values.giftMessage}”</span>
                  </Summary>
                )}
              </ul>
              <div className="flex items-center gap-4 rounded-2xl bg-bond-paper p-3">
                <ListingImage path={chosen.image_path} kind="surprise" alt="" sizes="96px" className="aspect-[4/3] w-20 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="font-semibold text-bond-ink">{chosen.title}</p>
                  <p className="text-xs text-bond-ink/55">{chosen.shop.name}</p>
                </div>
              </div>
              <p className="text-xs text-bond-ink/55">
                {chosen.shop.name} will call {values.recipientName.split(" ")[0] || "the recipient"} before the surprise to make
                sure they&apos;re there.
              </p>
            </div>
            <aside className="space-y-4">
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Surprise</dt>
                    <dd>{formatPeso(chosen.price)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-bond-ink/60">Delivery</dt>
                    <dd>{chosen.shop.delivery_fee ? formatPeso(chosen.shop.delivery_fee) : "Free"}</dd>
                  </div>
                  <div className="flex justify-between border-t border-bond-ink/8 pt-3 font-heading text-lg font-bold">
                    <dt>Total</dt>
                    <dd>{formatPeso(total)}</dd>
                  </div>
                </dl>
              </div>
              <ErrorMessage message={serverState && !serverState.ok ? serverState.message : undefined} />
              <Button size="lg" onClick={submit} loading={pending} loadingText="Booking…" className="w-full">
                Book & pay {formatPeso(total)}
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs text-bond-ink/55">
                <ShieldCheck className="size-4" aria-hidden /> Held by BOND until you confirm.
              </p>
            </aside>
          </section>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={pending}>
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < 2 && !(step === 1 && options.length === 0) && (
          <Button size="lg" onClick={() => validateStep(step) && go(step + 1)} className="group">
            {step === 0 ? "Choose a surprise" : "Review"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
      <span>
        <span className="block text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</span>
        <span className="text-bond-ink/85">{children}</span>
      </span>
    </li>
  );
}
