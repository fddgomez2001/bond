"use client";

import { useState, useTransition } from "react";
import { CreditCard, FlaskConical, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { payNow } from "@/lib/marketplace/customer-actions";
import { cn } from "@/lib/utils";

const methods = [
  { value: "gcash" as const, label: "GCash", icon: Smartphone, hint: "Pay with your GCash wallet" },
  { value: "maya" as const, label: "Maya", icon: Wallet, hint: "Pay with your Maya wallet" },
  { value: "card" as const, label: "Credit / debit card", icon: CreditCard, hint: "Visa or Mastercard" },
];

/**
 * Test-mode checkout. No money moves: the server records the payment as
 * held. A real gateway (e.g. PayMongo) replaces payNow later.
 */
export function PaymentPanel({ target, amount }: { target: { type: "order" | "booking"; id: string }; amount: string }) {
  const [method, setMethod] = useState<(typeof methods)[number]["value"]>("gcash");
  const [cardNumber, setCardNumber] = useState("");
  const [failure, setFailure] = useState<string>();
  const [cardError, setCardError] = useState<string>();
  const [attempts, setAttempts] = useState(0);
  const [pending, startTransition] = useTransition();

  function pay() {
    setFailure(undefined);
    setCardError(undefined);
    startTransition(async () => {
      // Success redirects to the order with a "payment successful" toast.
      const result = await payNow({ target, method, cardNumber: method === "card" ? cardNumber : undefined });
      if (result && !result.ok) {
        setAttempts((n) => n + 1);
        setFailure(result.message);
        setCardError(result.fieldErrors?.cardNumber?.[0]);
      }
    });
  }

  return (
    <div className="space-y-5">
      <Alert tone="warning" title="Test mode">
        No real money is charged. Card <strong>4000 0000 0000 0002</strong> simulates a declined payment.
      </Alert>

      <fieldset disabled={pending} className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-bond-ink">Payment method</legend>
        {methods.map((m) => (
          <label
            key={m.value}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 ease-smooth",
              "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
              method === m.value ? "border-bond-slate ring-4 ring-bond-yellow/40" : "border-bond-ink/12 hover:border-bond-slate/30",
            )}
          >
            <input type="radio" name="method" className="sr-only" checked={method === m.value} onChange={() => setMethod(m.value)} />
            <span className={cn("flex size-10 items-center justify-center rounded-xl", method === m.value ? "bg-bond-slate text-white" : "bg-bond-yellow/40 text-bond-slate")}>
              <m.icon className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-bond-ink">{m.label}</span>
              <span className="block text-xs text-bond-ink/55">{m.hint}</span>
            </span>
            <span
              aria-hidden
              className={cn(
                "size-5 rounded-full border-2 transition-all duration-300",
                method === m.value ? "border-bond-slate bg-bond-slate shadow-[inset_0_0_0_3px_white]" : "border-bond-ink/25",
              )}
            />
          </label>
        ))}
      </fieldset>

      {method === "card" && (
        <div className="animate-[fade-up_0.4s_var(--ease-smooth)_both]">
          <Field id="card-number" label="Card number" required error={cardError}>
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))}
              placeholder="4242 4242 4242 4242"
              invalid={Boolean(cardError)}
              disabled={pending}
            />
          </Field>
        </div>
      )}

      {failure && (
        <Alert tone="error" title="Payment unsuccessful" className="animate-[fade-up_0.4s_var(--ease-smooth)_both]">
          {failure}
          {attempts > 1 && <span className="mt-1 block text-xs opacity-80">Still not working? Try another payment method.</span>}
        </Alert>
      )}

      <Button size="lg" onClick={pay} loading={pending} loadingText="Processing payment…" className="w-full">
        <FlaskConical className="size-4 opacity-70" aria-hidden />
        {failure ? `Try again · ${amount}` : `Pay ${amount}`}
      </Button>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-bond-ink/55">
        <ShieldCheck className="size-4 shrink-0" aria-hidden /> BOND holds your payment and only releases it to the shop when you
        confirm.
      </p>
    </div>
  );
}
