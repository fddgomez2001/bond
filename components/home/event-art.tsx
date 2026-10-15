import { Music, PartyPopper, UsersRound } from "lucide-react";
import type { DemoEvent } from "@/lib/data/demo-events";
import { cn } from "@/lib/utils";

const icons = { music: Music, community: UsersRound, celebration: PartyPopper };

/** Placeholder artwork for an event until real images exist. Animates inside a `group` card. */
export function EventArt({ event, className }: { event: DemoEvent; className?: string }) {
  const Icon = icons[event.icon];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        event.artwork,
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -right-6 -bottom-8 size-32 rounded-full bg-white/15 transition-transform duration-700 ease-smooth group-hover:-translate-x-3 group-hover:-translate-y-2"
      />
      <span
        aria-hidden
        className="absolute -top-10 -left-6 size-28 rounded-full bg-black/5 transition-transform duration-700 ease-smooth group-hover:translate-x-2 group-hover:translate-y-2"
      />
      <Icon
        aria-hidden
        className="relative size-14 text-white drop-shadow transition-transform duration-500 ease-spring group-hover:-rotate-6 group-hover:scale-110"
      />
    </div>
  );
}
