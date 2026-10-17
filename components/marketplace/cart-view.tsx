"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { formatPeso } from "@/lib/format";
import { updateCartItem } from "@/lib/marketplace/customer-actions";
import type { CartLine } from "@/lib/marketplace/customer-data";
import { cn } from "@/lib/utils";
import { EmptyState, ListingImage } from "./bits";

type Cart = {
  lines: CartLine[];
  shop: CartLine["shop"];
  subtotal: number;
  deliveryFee: number;
};

/** Cart lines with instant (optimistic) quantity changes. */
export function CartView({ cart }: { cart: Cart }) {
  const [pending, startTransition] = useTransition();
  const [lines, setOptimistic] = useOptimistic(cart.lines, (current, change: { listingId: string; quantity: number }) =>
    change.quantity === 0
      ? current.filter((l) => l.listingId !== change.listingId)
      : current.map((l) => (l.listingId === change.listingId ? { ...l, quantity: change.quantity } : l)),
  );

  function change(listingId: string, quantity: number) {
    startTransition(async () => {
      setOptimistic({ listingId, quantity });
      const result = await updateCartItem({ listingId, quantity });
      if (!result.ok) toast({ tone: "error", title: "Couldn't update your cart", message: result.message });
    });
  }

  const available = lines.filter((l) => l.available);
  const subtotal = available.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const deliveryFee = available.length ? cart.deliveryFee : 0;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        action={
          <Link href="/order/gift" className={buttonClasses({ variant: "gold" })}>
            Browse gift shops
          </Link>
        }
      >
        Pick a shop and add the gifts you want to send.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="space-y-3 lg:col-span-2" aria-label="Items">
        {cart.shop && (
          <p className="text-sm text-bond-ink/65">
            From{" "}
            <Link href={`/shops/${cart.shop.slug}?tab=gift`} className="font-semibold text-bond-slate underline-offset-2 hover:underline">
              {cart.shop.name}
            </Link>{" "}
            ·{" "}
            <Link href={`/shops/${cart.shop.slug}?tab=gift`} className="text-bond-slate underline underline-offset-2">
              add more gifts
            </Link>
          </p>
        )}
        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.listingId}
              className={cn(
                "flex items-center gap-4 rounded-3xl border bg-white p-3 shadow-[var(--shadow-card)] transition-opacity duration-300 sm:p-4",
                line.available ? "border-bond-ink/8" : "border-red-200 opacity-75",
              )}
            >
              <ListingImage path={line.imagePath} kind="gift" alt="" sizes="112px" className="aspect-square w-20 shrink-0 rounded-2xl sm:w-24" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading font-semibold text-bond-ink">{line.title}</p>
                {line.available ? (
                  <p className="text-sm text-bond-ink/60">{formatPeso(line.price)} each</p>
                ) : (
                  <p className="text-sm font-medium text-red-700">No longer available — it won&apos;t be ordered.</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {line.available && (
                    <div className="flex items-center rounded-xl border border-bond-ink/12" role="group" aria-label={`Quantity of ${line.title}`}>
                      <button
                        type="button"
                        onClick={() => change(line.listingId, line.quantity - 1)}
                        className="flex size-9 items-center justify-center rounded-l-xl text-bond-slate hover:bg-bond-cream"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => change(line.listingId, Math.min(99, line.quantity + 1))}
                        disabled={line.quantity >= 99}
                        className="flex size-9 items-center justify-center rounded-r-xl text-bond-slate hover:bg-bond-cream disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => change(line.listingId, 0)}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </button>
                </div>
              </div>
              {line.available && (
                <p className="hidden font-heading font-bold text-bond-ink sm:block">{formatPeso(line.price * line.quantity)}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-lg font-bold text-bond-ink">Order summary</h2>
          <dl className={cn("mt-4 space-y-2 text-sm transition-opacity", pending && "opacity-60")}>
            <div className="flex justify-between">
              <dt className="text-bond-ink/60">Subtotal</dt>
              <dd>{formatPeso(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-bond-ink/60">Delivery fee</dt>
              <dd>{deliveryFee === 0 ? "Free" : formatPeso(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-bond-ink/8 pt-3 font-heading text-lg font-bold">
              <dt>Total</dt>
              <dd>{formatPeso(subtotal + deliveryFee)}</dd>
            </div>
          </dl>
          {available.length > 0 ? (
            <Link
              href="/checkout"
              transitionTypes={["nav-forward"]}
              aria-disabled={pending || undefined}
              className={buttonClasses({ size: "lg", className: cn("group mt-5 w-full", pending && "pointer-events-none opacity-60") })}
            >
              Checkout
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : (
            <p className="mt-5 text-sm text-red-700">None of these items can be ordered right now.</p>
          )}
          <p className="mt-3 text-xs text-bond-ink/55">You&apos;ll add the recipient&apos;s details on the next step.</p>
        </div>
      </aside>
    </div>
  );
}
