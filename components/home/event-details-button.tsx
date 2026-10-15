"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, X } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import type { DemoEvent } from "@/lib/data/demo-events";
import { EventArt } from "./event-art";

/** "View Details" opens a native <dialog> (focus trap and Esc for free). */
export function EventDetailsButton({ event }: { event: DemoEvent }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `${event.id}-title`;

  return (
    <>
      <Button
        variant="primary"
        className="group/btn w-full transition-all duration-300 ease-smooth active:scale-[0.98]"
        onClick={() => dialogRef.current?.showModal()}
      >
        View Details
        <ArrowRight
          className="size-4 transition-transform duration-300 ease-smooth group-hover/btn:translate-x-1"
          aria-hidden
        />
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="bond-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-0 shadow-2xl"
        onClick={(e) => {
          // Clicking the backdrop closes the dialog.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <EventArt event={event} className="h-44" />
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wide text-bond-amber uppercase">
                {event.category} · Demo content
              </span>
              <h3 id={titleId} className="mt-1 font-heading text-xl font-bold text-bond-ink">
                {event.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full p-2 text-bond-ink/60 hover:bg-bond-ink/5"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <ul className="space-y-2 text-sm text-bond-ink/75">
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4 text-bond-slate" aria-hidden /> {event.date}
            </li>
            <li className="flex items-center gap-2">
              <Clock3 className="size-4 text-bond-slate" aria-hidden /> {event.time}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-bond-slate" aria-hidden /> {event.venue}
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-bond-ink/75">{event.description}</p>
          <p className="rounded-2xl bg-bond-cream px-4 py-3 text-xs text-bond-ink/70">
            This is sample content to preview the layout. Real event details will appear here once event
            listings launch.
          </p>
          <Link href="/signup/customer" className={buttonClasses({ variant: "gold", className: "w-full" })}>
            Join BOND for updates
          </Link>
        </div>
      </dialog>
    </>
  );
}
