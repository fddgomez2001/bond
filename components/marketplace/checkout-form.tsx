"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { siteConfig } from "@/lib/config/site";
import { placeGiftOrder } from "@/lib/marketplace/customer-actions";
import type { FormState } from "@/types/auth";

export type DeliveryDefaults = { recipientName: string; recipientPhone: string };

/** Recipient + delivery fields shared by gift checkout and the surprise flow. */
export function DeliveryFields({
  idPrefix,
  values,
  onChange,
  errors,
  showMessage = true,
}: {
  idPrefix: string;
  values: Record<"recipientName" | "recipientPhone" | "address" | "giftMessage" | "notes", string>;
  onChange: (key: keyof DeliveryFieldsValues, value: string) => void;
  errors: Record<string, string | undefined>;
  showMessage?: boolean;
}) {
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id={id("name")} label="Recipient's name" required error={errors.recipientName}>
          <Input
            id={id("name")}
            value={values.recipientName}
            onChange={(e) => onChange("recipientName", e.target.value)}
            autoComplete="name"
            maxLength={100}
            invalid={Boolean(errors.recipientName)}
            aria-describedby={describedBy(id("name"), errors.recipientName)}
          />
        </Field>
        <Field id={id("phone")} label="Recipient's contact number" required error={errors.recipientPhone} hint="The shop calls this number to arrange delivery.">
          <Input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            value={values.recipientPhone}
            onChange={(e) => onChange("recipientPhone", e.target.value)}
            autoComplete="tel"
            placeholder={siteConfig.phonePlaceholder}
            invalid={Boolean(errors.recipientPhone)}
            aria-describedby={describedBy(id("phone"), errors.recipientPhone, true)}
          />
        </Field>
      </div>
      <Field id={id("address")} label="Delivery address" required error={errors.address}>
        <Textarea
          id={id("address")}
          value={values.address}
          onChange={(e) => onChange("address", e.target.value)}
          autoComplete="street-address"
          maxLength={300}
          className="min-h-20"
          placeholder="House / unit, street, barangay, city"
          invalid={Boolean(errors.address)}
          aria-describedby={describedBy(id("address"), errors.address)}
        />
      </Field>
      {showMessage && (
        <Field id={id("message")} label="Message for the recipient (optional)" error={errors.giftMessage} hint="The shop includes it with the gift.">
          <Textarea
            id={id("message")}
            value={values.giftMessage}
            onChange={(e) => onChange("giftMessage", e.target.value)}
            maxLength={500}
            className="min-h-20"
            placeholder="Happy birthday! Love, …"
            aria-describedby={describedBy(id("message"), errors.giftMessage, true)}
          />
        </Field>
      )}
      <Field id={id("notes")} label="Notes for the shop (optional)" error={errors.notes}>
        <Textarea
          id={id("notes")}
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          maxLength={500}
          className="min-h-20"
          placeholder="Landmarks, best time to deliver, gate code…"
        />
      </Field>
    </div>
  );
}

export type DeliveryFieldsValues = { recipientName: string; recipientPhone: string; address: string; giftMessage: string; notes: string };

export const firstErrors = (state: FormState | null) =>
  Object.fromEntries(Object.entries(state?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]])) as Record<string, string | undefined>;

/** Gift checkout: who receives it, then on to payment. */
export function CheckoutForm({ shopId, defaults, total }: { shopId: string; defaults: DeliveryDefaults; total: string }) {
  const [values, setValues] = useState<DeliveryFieldsValues>({
    recipientName: defaults.recipientName,
    recipientPhone: defaults.recipientPhone,
    address: "",
    giftMessage: "",
    notes: "",
  });
  const [state, setState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      // Success redirects to the payment page.
      const result = await placeGiftOrder(shopId, values);
      if (result && !result.ok) setState(result);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset disabled={pending} className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <legend className="sr-only">Delivery details</legend>
        <h2 className="mb-5 font-heading text-lg font-bold text-bond-ink">Who is it for?</h2>
        <DeliveryFields
          idPrefix="checkout"
          values={values}
          onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
          errors={firstErrors(state)}
        />
      </fieldset>
      <ErrorMessage message={state && !state.ok ? state.message : undefined} />
      <Button type="submit" size="lg" loading={pending} loadingText="Placing your order…" className="w-full">
        Place order & pay {total}
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-bond-ink/55">
        <ShieldCheck className="size-4" aria-hidden /> BOND holds your payment until you confirm delivery.
      </p>
    </form>
  );
}
