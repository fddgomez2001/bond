import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { inputClasses } from "@/components/ui/field";
import type { ListingKind } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

export const offerFilters: { value: ListingKind | null; label: string }[] = [
  { value: null, label: "All shops" },
  { value: "gift", label: "Gifts" },
  { value: "surprise", label: "Surprises" },
  { value: "service", label: "Event services" },
];

export const parseOffer = (value: unknown): ListingKind | null => offerFilters.find((f) => f.value === value)?.value ?? null;

/** Search box + category chips for the shop directory. */
export function ShopFilters({ base, offer, query, showOffers = true }: { base: string; offer: ListingKind | null; query: string; showOffers?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <Form action={base} scroll={false} className="relative max-w-xl">
        {offer && <input type="hidden" name="offer" value={offer} />}
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-bond-ink/40" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search shops, vendors or cities"
          aria-label="Search shops"
          className={inputClasses(false, "h-13 rounded-2xl border-white/0 pl-12 shadow-[var(--shadow-card)]")}
        />
      </Form>
      {showOffers && (
        <nav aria-label="Filter shops" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex w-max gap-2">
            {offerFilters.map((f) => {
              const active = f.value === offer;
              return (
                <li key={f.label}>
                  <Link
                    href={{ pathname: base, query: { ...(f.value && { offer: f.value }), ...(query && { q: query }) } }}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-smooth",
                      active ? "bg-bond-slate text-white shadow-md" : "bg-white/60 text-bond-slate hover:bg-white",
                    )}
                  >
                    {f.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
