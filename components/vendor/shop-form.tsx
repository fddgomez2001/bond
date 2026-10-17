"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarHeart, Gift, PartyPopper } from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { siteConfig } from "@/lib/config/site";
import { kindMeta, type ListingKind } from "@/lib/marketplace/constants";
import { saveShop } from "@/lib/marketplace/vendor-actions";
import { cn } from "@/lib/utils";
import type { FormState } from "@/types/auth";
import type { Shop } from "@/types/marketplace";
import { ImagePicker } from "./image-picker";

const offerIcons: Record<ListingKind, typeof Gift> = { gift: Gift, surprise: PartyPopper, service: CalendarHeart };

export function ShopForm({ shop, logoUrl }: { shop: Shop | null; logoUrl: string | null }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [offers, setOffers] = useState<ListingKind[]>(shop?.offers ?? ["gift"]);
  const [isOpen, setIsOpen] = useState(shop?.is_open ?? true);
  const [state, setState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();
  const error = (key: string) => state?.fieldErrors?.[key]?.[0];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.delete("offers");
    for (const offer of offers) data.append("offers", offer);
    data.set("isOpen", String(isOpen));
    if (logo) data.set("logo", logo);
    startTransition(async () => {
      const result = await saveShop(data);
      setState(result);
      if (result.ok) {
        setLogo(null);
        toast({ tone: "success", title: shop ? "Shop saved" : "Shop created", message: result.message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
      <fieldset disabled={pending} className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-2">
        <legend className="sr-only">Shop details</legend>
        <Field id="shop-name" label="Shop name" required error={error("name")}>
          <Input
            id="shop-name"
            name="name"
            defaultValue={shop?.name}
            maxLength={80}
            required
            invalid={Boolean(error("name"))}
            aria-describedby={describedBy("shop-name", error("name"))}
            placeholder="e.g. Bloom & Bows Cebu"
          />
        </Field>
        <Field id="shop-tagline" label="Tagline" error={error("tagline")} hint="One short line customers see on your shop card." >
          <Input
            id="shop-tagline"
            name="tagline"
            defaultValue={shop?.tagline ?? ""}
            maxLength={120}
            aria-describedby={describedBy("shop-tagline", error("tagline"), true)}
            placeholder="Handmade flower boxes delivered same day"
          />
        </Field>
        <Field id="shop-description" label="About your shop" error={error("description")}>
          <Textarea
            id="shop-description"
            name="description"
            defaultValue={shop?.description ?? ""}
            maxLength={2000}
            placeholder="What you make, how long you've been doing it, what makes you special."
          />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="shop-city" label="City / area" error={error("city")}>
            <Input id="shop-city" name="city" defaultValue={shop?.city ?? ""} maxLength={80} placeholder="e.g. Cebu City" />
          </Field>
          <Field
            id="shop-contact"
            label="Contact number"
            error={error("contactNumber")}
            hint="Shown to customers who order from you."
          >
            <Input
              id="shop-contact"
              name="contactNumber"
              type="tel"
              inputMode="tel"
              defaultValue={shop?.contact_number ?? ""}
              invalid={Boolean(error("contactNumber"))}
              aria-describedby={describedBy("shop-contact", error("contactNumber"), true)}
              placeholder={siteConfig.phonePlaceholder}
            />
          </Field>
        </div>
        <Field
          id="shop-fee"
          label="Delivery fee (₱)"
          error={error("deliveryFee")}
          hint="Added once per gift order. Use 0 for free delivery."
        >
          <Input
            id="shop-fee"
            name="deliveryFee"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            defaultValue={shop?.delivery_fee ?? 0}
            invalid={Boolean(error("deliveryFee"))}
            aria-describedby={describedBy("shop-fee", error("deliveryFee"), true)}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-semibold text-bond-ink">What do you offer?</legend>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(kindMeta) as ListingKind[]).map((kind) => {
              const Icon = offerIcons[kind];
              const checked = offers.includes(kind);
              return (
                <label
                  key={kind}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 ease-smooth",
                    "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                    checked ? "border-bond-slate bg-bond-yellow/25 ring-4 ring-bond-yellow/30" : "border-bond-ink/12 hover:border-bond-slate/30",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      setOffers((current) => (checked ? current.filter((k) => k !== kind) : [...current, kind]))
                    }
                  />
                  <Icon className={cn("mt-0.5 size-5 shrink-0", checked ? "text-bond-slate" : "text-bond-ink/40")} aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold text-bond-ink">{kindMeta[kind].plural}</span>
                    <span className="block text-xs text-bond-ink/60">{kindMeta[kind].description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {error("offers") && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {error("offers")}
            </p>
          )}
        </fieldset>
      </fieldset>

      <div className="space-y-6">
        <section className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <ImagePicker
            label="Shop logo"
            hint="Square images look best."
            shape="square"
            currentUrl={logoUrl}
            file={logo}
            onChange={setLogo}
            error={error("logo")}
            disabled={pending}
          />

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-bond-paper p-4">
            <span>
              <span className="block text-sm font-semibold text-bond-ink">Shop is open</span>
              <span className="block text-xs text-bond-ink/60">
                {isOpen ? "Customers can find and order from you." : "Hidden from customers until you reopen."}
              </span>
            </span>
            <input type="checkbox" className="peer sr-only" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} disabled={pending} />
            <span
              aria-hidden
              className="relative h-7 w-12 shrink-0 rounded-full bg-bond-ink/20 transition-colors duration-300 peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-bond-yellow/60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-spring peer-checked:after:translate-x-5"
            />
          </label>
        </section>

        <ErrorMessage message={state && !state.ok ? state.message : undefined} />
        <Button type="submit" size="lg" loading={pending} loadingText="Saving…" className="w-full">
          {shop ? "Save changes" : "Create my shop"}
        </Button>
      </div>
    </form>
  );
}
