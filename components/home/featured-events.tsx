import { CalendarDays, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { demoEvents } from "@/lib/data/demo-events";
import { EventArt } from "./event-art";
import { EventDetailsButton } from "./event-details-button";
import { SectionHeading } from "./section-heading";

export function FeaturedEvents() {
  return (
    <section id="events" className="bg-bond-paper py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Events"
            title="Discover What's Happening"
            description="Find events, explore new experiences, and discover opportunities to connect."
            badge="Demo content"
          />
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {demoEvents.map((event, index) => (
            <Reveal as="li" key={event.id} delay={index * 120} className="flex">
              <article className="group flex w-full flex-col overflow-hidden rounded-[28px] border border-bond-ink/8 bg-white shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)]">
                <div className="relative overflow-hidden">
                  <EventArt
                    event={event}
                    className="aspect-[16/10] transition-transform duration-700 ease-smooth group-hover:scale-[1.06]"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-bond-slate shadow-sm">
                    {event.category}
                  </span>
                  <span className="absolute top-4 right-4 rounded-full bg-bond-ink/75 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-white uppercase">
                    Demo
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                  <h3 className="font-heading text-lg font-bold text-bond-ink transition-colors duration-300 group-hover:text-bond-slate sm:text-xl">
                    {event.title}
                  </h3>
                  <ul className="space-y-1.5 text-sm text-bond-ink/70">
                    <li className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
                      {event.date} · {event.time}
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
                      {event.venue}
                    </li>
                  </ul>
                  <p className="flex-1 text-sm leading-relaxed text-bond-ink/70">{event.description}</p>
                  <EventDetailsButton event={event} />
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
