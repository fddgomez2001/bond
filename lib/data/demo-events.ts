/**
 * DEMO CONTENT — not real events. Replace with data from the events table
 * when event management is built. Nothing here is a confirmed event,
 * organizer, venue, schedule or price.
 */

export type DemoEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  /** Tailwind gradient used as the placeholder image. */
  artwork: string;
  icon: "music" | "community" | "celebration";
};

export const demoEvents: DemoEvent[] = [
  {
    id: "demo-1",
    title: "Sample Community Meetup",
    category: "Community",
    date: "Date to be announced",
    time: "Time to be announced",
    venue: "Venue to be announced",
    description:
      "A placeholder listing showing how a community gathering will appear on BOND, with space for a short summary.",
    artwork: "from-bond-yellow via-bond-gold to-bond-amber",
    icon: "community",
  },
  {
    id: "demo-2",
    title: "Sample Live Music Night",
    category: "Music",
    date: "Date to be announced",
    time: "Time to be announced",
    venue: "Venue to be announced",
    description:
      "Example card for a music event. Real performers, schedules and ticket details will come from event organizers.",
    artwork: "from-bond-slate via-bond-slate-light to-[#7fa3a8]",
    icon: "music",
  },
  {
    id: "demo-3",
    title: "Sample Celebration Package",
    category: "Celebrations",
    date: "Date to be announced",
    time: "Time to be announced",
    venue: "Venue to be announced",
    description:
      "Example of how a vendor's birthday or party offering could be presented once vendors are approved.",
    artwork: "from-[#ffd36b] via-[#ff9f00] to-[#e86a3a]",
    icon: "celebration",
  },
];
