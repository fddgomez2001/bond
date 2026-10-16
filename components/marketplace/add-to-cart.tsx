"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { addToCart } from "@/lib/marketplace/customer-actions";

/** Quantity + add to cart. A cart holds one shop's gifts; switching shops asks first. */
export function AddToCart({ listingId, title }: { listingId: string; title: string }) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [conflict, setConflict] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function add(replace = false) {
    startTransition(async () => {
      const result = await addToCart({ listingId, quantity, replace });
      if (result.conflictShop) {
        setConflict(result.conflictShop);
        return;
      }
      setConflict(null);
      if (!result.ok) {
        toast({ tone: "error", title: "Couldn't add to cart", message: result.message });
        return;
      }
      setAdded(true);
      toast({ tone: "success", title: "Added to your cart", message: `${quantity} × ${title}` });
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-2xl border border-bond-ink/12 bg-white" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || pending}
            className="flex size-12 items-center justify-center rounded-l-2xl text-bond-slate transition-colors hover:bg-bond-cream disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-10 text-center font-heading text-lg font-bold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            disabled={quantity >= 99 || pending}
            className="flex size-12 items-center justify-center rounded-r-2xl text-bond-slate transition-colors hover:bg-bond-cream disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <Button size="lg" onClick={() => add()} loading={pending} loadingText="Adding…" className="flex-1 transition-transform active:scale-[0.98]">
          <ShoppingCart className="size-5" aria-hidden />
          Add to cart
        </Button>
      </div>
      {added && (
        <Link
          href="/cart"
          className={buttonClasses({ variant: "gold", size: "lg", className: "w-full animate-[fade-up_0.45s_var(--ease-smooth)_both]" })}
        >
          View cart & check out
        </Link>
      )}

      <Dialog
        open={Boolean(conflict)}
        onClose={() => !pending && setConflict(null)}
        title="Start a new cart?"
        description={
          <>
            Your cart has gifts from <strong>{conflict}</strong>. A BOND order comes from one shop, so they deliver everything
            together. Start a new cart with this gift instead?
          </>
        }
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/cart" className={buttonClasses({ variant: "outline" })}>
            Go to my cart
          </Link>
          <Button onClick={() => add(true)} loading={pending}>
            Start new cart
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
