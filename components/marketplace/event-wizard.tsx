"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  Landmark,
  ListChecks,
  MapPin,
  Package,
  PartyPopper,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ErrorMessage } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { formatDateTime, formatPeso } from "@/lib/format";
import {
  checklistCategories,
  eventSteps,
  eventTypeLabel,
  eventTypes,
  serviceCategoryLabel,
  toPhIso,
  type EventType,
  type ServiceCategory,
} from "@/lib/marketplace/constants";
import { placeEventBooking } from "@/lib/marketplace/customer-actions";
import { cn } from "@/lib/utils";
import type { FormState } from "@/types/auth";
import type { FlowOption } from "@/types/marketplace";
import { EmptyState, ListingImage, WizardSteps } from "./bits";
import { firstErrors } from "./checkout-form";

const typeIcons: Record<EventType, typeof Briefcase> = { corporate: Briefcase, social: PartyPopper, cultural: Landmark };

const fieldStep: Record<string, number> = { eventType: 0, eventAt: 1, place: 1, guestCount: 1, notes: 1, mode: 2, listingIds: 2 };

const fits = (option: FlowOption, type: EventType | null) => Boolean(type) && (option.event_types.length === 0 || option.event_types.includes(type!));

/**
 * Event services flow: event type → date, time & place → a ready package
 * or a customized checklist (one service per category) → review → book & pay.
 * A booking can include several shops; each confirms its own part.
 */
export function EventWizard({ options, minLocal, initialListing }: { options: FlowOption[]; minLocal: string; initialListing: string | null }) {
  const initial = options.find((o) => o.id === initialListing) ?? null;
  const initialIsPackage = initial?.service_category === "package";

  const [step, setStep] = useState(0);
  // Only animate after the first step change (the page itself already fades in).
  const [moved, setMoved] = useState(false);
  const [eventType, setEventType] = useState<EventType | null>(initial?.event_types.length === 1 ? initial.event_types[0] : null);
  const [details, setDetails] = useState({ eventAt: "", place: "", guestCount: "", notes: "" });
  const [mode, setMode] = useState<"package" | "custom">(initial && !initialIsPackage ? "custom" : "package");
  const [packageId, setPackageId] = useState<string | null>(initialIsPackage ? initial.id : null);
  const [checked, setChecked] = useState<ServiceCategory[]>(initial && !initialIsPackage && initial.service_category ? [initial.service_category] : []);
  const [picks, setPicks] = useState<Partial<Record<ServiceCategory, string>>>(
    initial && !initialIsPackage && initial.service_category ? { [initial.service_category]: initial.id } : {},
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverState, setServerState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  const available = useMemo(() => options.filter((o) => fits(o, eventType)), [options, eventType]);
  const packages = available.filter((o) => o.service_category === "package");
  const byCategory = (category: ServiceCategory) => available.filter((o) => o.service_category === category);
  const chosenPackage = packages.find((p) => p.id === packageId) ?? null;
  const chosenServices = checked
    .map((c) => available.find((o) => o.id === picks[c]))
    .filter((o): o is FlowOption => Boolean(o));
  const selected = mode === "package" ? (chosenPackage ? [chosenPackage] : []) : chosenServices;
  const total = selected.reduce((sum, o) => sum + o.price, 0);
  const shopsInvolved = [...new Set(selected.map((o) => o.shop.name))];

  function go(next: number) {
    setMoved(true);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep(index: number) {
    const e: Record<string, string> = {};
    if (index === 0 && !eventType) e.eventType = "Choose the kind of event";
    if (index === 1) {
      if (!details.eventAt) e.eventAt = "Choose the date and time";
      else if (details.eventAt < minLocal) e.eventAt = "Choose a date at least 1 day from now";
      if (details.place.trim().length < 3) e.place = "Where is the event?";
      const guests = Number(details.guestCount);
      if (details.guestCount && (!Number.isInteger(guests) || guests < 1 || guests > 100000)) e.guestCount = "Enter a whole number";
    }
    if (index === 2) {
      if (mode === "package" && !chosenPackage) e.listingIds = "Choose a package";
      if (mode === "custom") {
        if (checked.length === 0) e.listingIds = "Tick at least one service you need";
        else if (chosenServices.length < checked.length) e.listingIds = "Pick a provider for every service you ticked";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function chooseType(type: EventType) {
    setEventType(type);
    setErrors({});
    // Drop choices that don't suit the new event type.
    if (packageId && !options.some((o) => o.id === packageId && fits(o, type))) setPackageId(null);
    setPicks((current) =>
      Object.fromEntries(Object.entries(current).filter(([, id]) => options.some((o) => o.id === id && fits(o, type)))),
    );
  }

  function toggleCategory(category: ServiceCategory) {
    setErrors({});
    setChecked((current) => (current.includes(category) ? current.filter((c) => c !== category) : [...current, category]));
  }

  function submit() {
    if (!eventType) return;
    setServerState(null);
    startTransition(async () => {
      const result = await placeEventBooking({
        eventType,
        mode,
        eventAt: details.eventAt,
        place: details.place,
        guestCount: details.guestCount || undefined,
        notes: details.notes || undefined,
        listingIds: selected.map((o) => o.id),
      });
      // Success redirects to the payment page.
      if (result && !result.ok) {
        setServerState(result);
        const fieldErrors = firstErrors(result);
        setErrors(fieldErrors);
        const firstStep = Math.min(...Object.keys(fieldErrors).map((k) => fieldStep[k] ?? 3));
        if (firstStep < 3) go(firstStep);
      }
    });
  }

  const nextLabel = ["Date & place", "Choose services", "Review"][step];

  return (
    <div className="space-y-6">
      <WizardSteps steps={eventSteps} current={step} />

      <div key={step} className={moved ? "animate-[fade-up_0.45s_var(--ease-smooth)_both]" : undefined}>
        {step === 0 && (
          <fieldset>
            <legend className="mb-4 font-heading text-lg font-bold text-bond-ink">What kind of event is it?</legend>
            {errors.eventType && (
              <p role="alert" className="mb-3 text-sm font-medium text-red-600">
                {errors.eventType}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {eventTypes.map((type) => {
                const Icon = typeIcons[type.value];
                const active = eventType === type.value;
                return (
                  <label
                    key={type.value}
                    className={cn(
                      "group flex cursor-pointer flex-col rounded-3xl border bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-300 ease-smooth sm:p-6",
                      "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                      active ? "border-bond-slate ring-4 ring-bond-yellow/50" : "border-bond-ink/8 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
                    )}
                  >
                    <input type="radio" name="event-type" className="sr-only" checked={active} onChange={() => chooseType(type.value)} />
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl transition-all duration-500 ease-spring group-hover:-rotate-6",
                        active ? "bg-bond-slate text-white" : "bg-bond-yellow/50 text-bond-slate",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="mt-4 font-heading text-lg font-bold text-bond-ink">{type.label}</span>
                    <span className="mt-1 text-sm text-bond-ink/60">{type.description}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <section className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-bond-ink">When and where?</h2>
              <p className="text-sm text-bond-ink/60">Philippine time. Book at least a day ahead so organizers can prepare.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="event-when" label="Date & time" required error={errors.eventAt}>
                <Input
                  id="event-when"
                  type="datetime-local"
                  min={minLocal}
                  value={details.eventAt}
                  onChange={(e) => setDetails((d) => ({ ...d, eventAt: e.target.value }))}
                  invalid={Boolean(errors.eventAt)}
                  aria-describedby={describedBy("event-when", errors.eventAt)}
                />
              </Field>
              <Field id="event-guests" label="Number of guests (optional)" error={errors.guestCount}>
                <Input
                  id="event-guests"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={details.guestCount}
                  onChange={(e) => setDetails((d) => ({ ...d, guestCount: e.target.value }))}
                  invalid={Boolean(errors.guestCount)}
                  aria-describedby={describedBy("event-guests", errors.guestCount)}
                />
              </Field>
            </div>
            <Field id="event-place" label="Place / venue" required error={errors.place} hint="If you still need a venue, write the city and tick Venue on the next step.">
              <Input
                id="event-place"
                value={details.place}
                onChange={(e) => setDetails((d) => ({ ...d, place: e.target.value }))}
                maxLength={200}
                placeholder="e.g. Grand Ballroom, Cebu City"
                invalid={Boolean(errors.place)}
                aria-describedby={describedBy("event-place", errors.place, true)}
              />
            </Field>
            <Field id="event-notes" label="Notes for your organizers (optional)" error={errors.notes}>
              <Textarea
                id="event-notes"
                value={details.notes}
                onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                maxLength={1000}
                placeholder="Theme, motif, dietary needs, program…"
              />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-bond-ink/5 p-1.5 sm:max-w-md" role="radiogroup" aria-label="How do you want to book?">
              {(
                [
                  { value: "package", label: "Choose a package", icon: Package },
                  { value: "custom", label: "Customize", icon: ListChecks },
                ] as const
              ).map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.value}
                  onClick={() => {
                    setMode(m.value);
                    setErrors({});
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ease-smooth",
                    mode === m.value ? "bg-white text-bond-ink shadow" : "text-bond-ink/60 hover:text-bond-ink",
                  )}
                >
                  <m.icon className="size-4" aria-hidden />
                  {m.label}
                </button>
              ))}
            </div>
            {errors.listingIds && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {errors.listingIds}
              </p>
            )}

            {mode === "package" ? (
              packages.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={`No packages for ${eventType ? eventTypeLabel(eventType).toLowerCase() : "this event"} yet`}
                  action={
                    <Button variant="gold" onClick={() => setMode("custom")}>
                      Customize my event instead
                    </Button>
                  }
                >
                  You can still put your event together service by service.
                </EmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {packages.map((option) => {
                    const active = option.id === packageId;
                    const open = preview === option.id;
                    return (
                      <li key={option.id}>
                        <div
                          className={cn(
                            "flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-[var(--shadow-card)] transition-all duration-300 ease-smooth",
                            active ? "border-bond-slate ring-4 ring-bond-yellow/50" : "border-bond-ink/8",
                          )}
                        >
                          <div className="flex gap-4 p-4">
                            <ListingImage path={option.image_path} kind="service" alt="" sizes="128px" className="aspect-[4/3] w-28 shrink-0 rounded-2xl" />
                            <div className="min-w-0">
                              <p className="font-heading font-semibold text-bond-ink">{option.title}</p>
                              <p className="text-xs text-bond-ink/55">by {option.shop.name}</p>
                              <p className="mt-1 font-heading font-bold text-bond-slate">{formatPeso(option.price)}</p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "grid px-4 transition-[grid-template-rows,opacity] duration-500 ease-smooth",
                              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                            )}
                          >
                            <div className="overflow-hidden" inert={!open}>
                              <p className="text-sm text-bond-ink/70">{option.description}</p>
                              <ul className="mt-3 space-y-1.5 pb-2">
                                {option.inclusions.map((item) => (
                                  <li key={item} className="flex items-start gap-2 text-sm text-bond-ink/80">
                                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-auto flex gap-2 border-t border-bond-ink/8 p-3">
                            <Button variant="ghost" size="sm" onClick={() => setPreview(open ? null : option.id)} aria-expanded={open} className="flex-1">
                              {open ? "Hide details" : "Preview package"}
                              <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} aria-hidden />
                            </Button>
                            <Button
                              size="sm"
                              variant={active ? "gold" : "primary"}
                              onClick={() => {
                                setPackageId(option.id);
                                setErrors({});
                              }}
                              className="flex-1"
                            >
                              {active ? (
                                <>
                                  <Check className="size-4" aria-hidden /> Selected
                                </>
                              ) : (
                                "Choose this package"
                              )}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <div className="space-y-6">
                <fieldset className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                  <legend className="sr-only">Services you need</legend>
                  <p className="font-heading font-bold text-bond-ink">1. Tick what you need</p>
                  <p className="text-sm text-bond-ink/60">Your event checklist — pick a provider for each one below.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {checklistCategories.map((category) => {
                      const count = byCategory(category.value).length;
                      const on = checked.includes(category.value);
                      return (
                        <label
                          key={category.value}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-smooth",
                            "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                            count === 0 && "cursor-not-allowed opacity-45",
                            on ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/15 text-bond-ink/80 hover:border-bond-slate/40",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            disabled={count === 0}
                            onChange={() => toggleCategory(category.value)}
                          />
                          {on && <Check className="size-4" aria-hidden />}
                          {category.label}
                          <span className={cn("text-xs", on ? "text-white/70" : "text-bond-ink/45")}>{count === 0 ? "none yet" : count}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {checked.length > 0 && (
                  <div className="space-y-5">
                    <p className="font-heading font-bold text-bond-ink">2. Pick a provider for each</p>
                    {checked.map((category) => (
                      <fieldset key={category} className="animate-[fade-up_0.45s_var(--ease-smooth)_both]">
                        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-bond-ink">
                          {serviceCategoryLabel(category)}
                          {picks[category] && available.some((o) => o.id === picks[category]) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                              <Check className="size-3" aria-hidden /> Picked
                            </span>
                          )}
                        </legend>
                        <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                          {byCategory(category).map((option) => {
                            const active = picks[category] === option.id;
                            return (
                              <li key={option.id} className="w-64 shrink-0 snap-start">
                                <label
                                  className={cn(
                                    "flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ease-smooth",
                                    "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bond-slate",
                                    active ? "border-bond-slate ring-4 ring-bond-yellow/50" : "border-bond-ink/10 hover:border-bond-slate/30",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`pick-${category}`}
                                    className="sr-only"
                                    checked={active}
                                    onChange={() => {
                                      setPicks((p) => ({ ...p, [category]: option.id }));
                                      setErrors({});
                                    }}
                                  />
                                  <ListingImage path={option.image_path} kind="service" alt="" sizes="256px" className="aspect-[16/9]" />
                                  <span className="flex flex-1 flex-col p-3">
                                    <span className="line-clamp-1 text-sm font-semibold text-bond-ink">{option.title}</span>
                                    <span className="text-xs text-bond-ink/55">by {option.shop.name}</span>
                                    <span className="mt-1 line-clamp-2 text-xs text-bond-ink/65">{option.description}</span>
                                    <span className="mt-auto pt-2 text-sm font-bold text-bond-slate">{formatPeso(option.price)}</span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </fieldset>
                    ))}
                    {chosenServices.length === checked.length && (
                      <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 animate-[fade-up_0.45s_var(--ease-smooth)_both]">
                        <Check className="size-4" aria-hidden /> All done — every service on your checklist has a provider.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {step === 3 && eventType && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-2">
              <h2 className="font-heading text-lg font-bold text-bond-ink">Review your booking</h2>
              <ul className="space-y-3 text-sm">
                <Summary icon={PartyPopper} label="Event">
                  {eventTypeLabel(eventType)} · {mode === "package" ? "Package" : "Customized"}
                </Summary>
                <Summary icon={CalendarClock} label="When">
                  {formatDateTime(toPhIso(details.eventAt))}
                </Summary>
                <Summary icon={MapPin} label="Where">
                  {details.place}
                  {details.guestCount && ` · ${details.guestCount} guests`}
                </Summary>
              </ul>
              <ul className="divide-y divide-bond-ink/8 rounded-2xl border border-bond-ink/8">
                {selected.map((option) => (
                  <li key={option.id} className="flex items-center gap-3 p-3 text-sm">
                    <ListingImage path={option.image_path} kind="service" alt="" sizes="80px" className="aspect-[4/3] w-16 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-bond-ink">{option.title}</span>
                      <span className="text-xs text-bond-ink/55">
                        {serviceCategoryLabel(option.service_category)} · {option.shop.name}
                      </span>
                    </span>
                    <span className="font-semibold">{formatPeso(option.price)}</span>
                  </li>
                ))}
              </ul>
              {shopsInvolved.length > 1 && (
                <p className="flex items-start gap-2 rounded-2xl bg-bond-cream/70 p-3 text-xs text-bond-ink/70">
                  <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {shopsInvolved.length} organizers ({shopsInvolved.join(", ")}) each confirm their part. You pay once; BOND
                  releases each payment when you confirm that part is done.
                </p>
              )}
            </div>
            <aside className="space-y-4">
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="flex justify-between font-heading text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPeso(total)}</span>
                </div>
                <p className="mt-1 text-xs text-bond-ink/55">Starting prices; organizers confirm final details with you.</p>
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
          <Link href="/dashboard/customer" transitionTypes={["nav-back"]} className={buttonClasses({ variant: "ghost" })}>
            <ArrowLeft className="size-4" aria-hidden /> Cancel
          </Link>
        )}
        {step < 3 && (
          <Button size="lg" onClick={() => validateStep(step) && go(step + 1)} className="group">
            {nextLabel}
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
