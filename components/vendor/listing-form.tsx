"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, Gift, PartyPopper, Plus, Trash2, X } from "lucide-react";
import { Alert, ErrorMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, describedBy, inputClasses } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { eventTypes, kindMeta, serviceCategories, type EventType, type ListingKind, type ServiceCategory } from "@/lib/marketplace/constants";
import { deleteListing, saveListing } from "@/lib/marketplace/vendor-actions";
import { cn } from "@/lib/utils";
import type { FormState } from "@/types/auth";
import type { Listing } from "@/types/marketplace";
import { ImagePicker } from "./image-picker";

const kindIcons: Record<ListingKind, typeof Gift> = { gift: Gift, surprise: PartyPopper, service: CalendarHeart };

/**
 * Add / edit a product (gift or surprise) or an event service. Saving
 * always sends the listing to an admin for approval.
 */
export function ListingForm({
  group,
  listing,
  imageUrl,
  initialKind,
}: {
  group: "products" | "services";
  listing: Listing | null;
  imageUrl: string | null;
  initialKind?: ListingKind;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<ListingKind>(listing?.kind ?? (group === "services" ? "service" : (initialKind ?? "gift")));
  const [category, setCategory] = useState<ServiceCategory | "">(listing?.service_category ?? "");
  const [events, setEvents] = useState<EventType[]>(listing?.event_types ?? []);
  const [inclusions, setInclusions] = useState<string[]>(listing?.inclusions.length ? listing.inclusions : [""]);
  const [isActive, setIsActive] = useState(listing?.is_active ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [state, setState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const error = (key: string) => state?.fieldErrors?.[key]?.[0];
  const isService = kind === "service";
  const isPackage = category === "package";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("kind", kind);
    data.set("isActive", String(isActive));
    data.delete("eventTypes");
    data.delete("inclusions");
    if (isService) {
      data.set("serviceCategory", category);
      for (const e of events) data.append("eventTypes", e);
      for (const line of inclusions) if (line.trim()) data.append("inclusions", line.trim());
    }
    if (listing) data.set("id", listing.id);
    if (image) data.set("image", image);
    startTransition(async () => {
      // Success redirects to the list with a "submitted for review" toast.
      const result = await saveListing(data);
      if (result && !result.ok) setState(result);
    });
  }

  function onDelete() {
    if (!listing) return;
    startDelete(async () => {
      const result = await deleteListing({ listingId: listing.id });
      if (!result.ok) {
        toast({ tone: "error", title: "Couldn't delete", message: result.message });
        return;
      }
      setConfirmDelete(false);
      toast({ tone: "success", title: "Listing deleted" });
      router.push(`/dashboard/vendor/${group}`);
    });
  }

  return (
    <>
      {listing?.status === "rejected" && (
        <Alert tone="warning" title="Changes requested by BOND" className="mb-6">
          <p className="whitespace-pre-line">{listing.review_notes || "This listing wasn't approved."}</p>
          <p className="mt-1 text-xs opacity-80">Update it below and save to send it for review again.</p>
        </Alert>
      )}
      {listing?.status === "approved" && (
        <Alert tone="info" className="mb-6">
          This listing is live. Saving changes sends it back for a quick review, and it&apos;s hidden from customers until it&apos;s
          approved again.
        </Alert>
      )}
      {listing?.status === "pending_review" && (
        <Alert tone="info" className="mb-6">
          Waiting for BOND&apos;s approval. You can still make changes.
        </Alert>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        <fieldset
          disabled={pending}
          className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-2"
        >
          <legend className="sr-only">Listing details</legend>

          {group === "products" && (
            <fieldset>
              <legend className="text-sm font-semibold text-bond-ink">Type</legend>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["gift", "surprise"] as const).map((value) => {
                  const Icon = kindIcons[value];
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 ease-smooth",
                        "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                        kind === value
                          ? "border-bond-slate bg-bond-yellow/25 ring-4 ring-bond-yellow/30"
                          : "border-bond-ink/12 hover:border-bond-slate/30",
                      )}
                    >
                      <input type="radio" name="kind-choice" className="sr-only" checked={kind === value} onChange={() => setKind(value)} />
                      <Icon className={cn("mt-0.5 size-5", kind === value ? "text-bond-slate" : "text-bond-ink/40")} aria-hidden />
                      <span>
                        <span className="block text-sm font-semibold text-bond-ink">{kindMeta[value].label}</span>
                        <span className="block text-xs text-bond-ink/60">
                          {value === "gift"
                            ? "Added to a cart and delivered by your shop."
                            : "Booked for a date & time; you call the recipient and deliver it."}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {isService && (
            <Field id="listing-category" label="Service category" required error={error("serviceCategory")}>
              <select
                id="listing-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className={inputClasses(Boolean(error("serviceCategory")))}
                aria-describedby={describedBy("listing-category", error("serviceCategory"))}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {serviceCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field id="listing-title" label={isPackage ? "Package name" : "Title"} required error={error("title")}>
            <Input
              id="listing-title"
              name="title"
              defaultValue={listing?.title}
              maxLength={100}
              invalid={Boolean(error("title"))}
              aria-describedby={describedBy("listing-title", error("title"))}
              placeholder={isService ? (isPackage ? "e.g. Debut Gold Package" : "e.g. Filipino buffet for 100") : "e.g. 12 red roses in a hat box"}
            />
          </Field>
          <Field id="listing-description" label="Description" required error={error("description")}>
            <Textarea
              id="listing-description"
              name="description"
              defaultValue={listing?.description}
              maxLength={2000}
              invalid={Boolean(error("description"))}
              aria-describedby={describedBy("listing-description", error("description"))}
              placeholder="What's included, sizes, how it's delivered or served."
            />
          </Field>
          <Field
            id="listing-price"
            label={isService ? "Starting price (₱)" : "Price (₱)"}
            required
            error={error("price")}
            hint={kind === "gift" ? "Your shop's delivery fee is added at checkout." : undefined}
          >
            <Input
              id="listing-price"
              name="price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              defaultValue={listing?.price}
              invalid={Boolean(error("price"))}
              aria-describedby={describedBy("listing-price", error("price"), kind === "gift")}
            />
          </Field>

          {isService && (
            <>
              <fieldset>
                <legend className="text-sm font-semibold text-bond-ink">Event types</legend>
                <p className="text-xs text-bond-ink/60">Leave all unticked if it suits every kind of event.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {eventTypes.map((type) => {
                    const checked = events.includes(type.value);
                    return (
                      <label
                        key={type.value}
                        className={cn(
                          "cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-smooth",
                          "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                          checked ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/15 text-bond-ink/75 hover:border-bond-slate/40",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => setEvents((c) => (checked ? c.filter((e) => e !== type.value) : [...c, type.value]))}
                        />
                        {type.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-bond-ink">
                  {isPackage ? "What the package includes" : "Inclusions (optional)"}
                  {isPackage && <span aria-hidden className="ml-0.5 text-red-600">*</span>}
                </legend>
                <p className="text-xs text-bond-ink/60">
                  {isPackage
                    ? "Customers see this list when they preview the package."
                    : "Short bullet points, e.g. “4 hours of coverage”."}
                </p>
                <ul className="mt-2 space-y-2">
                  {inclusions.map((line, index) => (
                    <li key={index} className="flex gap-2">
                      <Input
                        aria-label={`Inclusion ${index + 1}`}
                        value={line}
                        maxLength={120}
                        onChange={(e) => setInclusions((c) => c.map((v, i) => (i === index ? e.target.value : v)))}
                        placeholder={index === 0 ? "e.g. Venue styling and backdrop" : "Another inclusion"}
                      />
                      <button
                        type="button"
                        onClick={() => setInclusions((c) => (c.length === 1 ? [""] : c.filter((_, i) => i !== index)))}
                        className="shrink-0 rounded-xl px-3 text-bond-ink/45 transition-colors hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove inclusion ${index + 1}`}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                {inclusions.length < 20 && (
                  <button
                    type="button"
                    onClick={() => setInclusions((c) => [...c, ""])}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-bond-slate hover:bg-bond-slate/10"
                  >
                    <Plus className="size-4" aria-hidden /> Add inclusion
                  </button>
                )}
                {error("inclusions") && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {error("inclusions")}
                  </p>
                )}
              </fieldset>
            </>
          )}
        </fieldset>

        <div className="space-y-6">
          <section className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <ImagePicker
              label="Photo"
              hint="A bright, clear photo sells best."
              currentUrl={imageUrl}
              file={image}
              onChange={setImage}
              error={error("image")}
              disabled={pending}
            />
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-bond-paper p-4">
              <span>
                <span className="block text-sm font-semibold text-bond-ink">Show in my shop</span>
                <span className="block text-xs text-bond-ink/60">
                  {isActive ? "Visible once approved." : "Hidden — customers can't order it."}
                </span>
              </span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={pending}
              />
              <span
                aria-hidden
                className="relative h-7 w-12 shrink-0 rounded-full bg-bond-ink/20 transition-colors duration-300 peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-bond-yellow/60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-spring peer-checked:after:translate-x-5"
              />
            </label>
          </section>

          <ErrorMessage message={state && !state.ok ? state.message : undefined} />
          <Button type="submit" size="lg" loading={pending} loadingText="Submitting…" className="w-full">
            {listing ? "Save & submit for review" : "Submit for review"}
          </Button>
          {listing && (
            <Button
              variant="ghost"
              className="w-full text-red-700! hover:bg-red-50!"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete listing
            </Button>
          )}
        </div>
      </form>

      <Dialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Delete this listing?"
        description="Customers won't see it anymore. Orders that already include it keep their details."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Keep it
          </Button>
          <Button onClick={onDelete} loading={deleting} loadingText="Deleting…" className="bg-red-600! hover:bg-red-700!">
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
