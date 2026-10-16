import Image from "next/image";
import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import type { ShopSummary } from "@/lib/marketplace/catalog";
import { kindMeta } from "@/lib/marketplace/constants";
import { mediaUrl } from "@/lib/marketplace/media";
import { initials } from "@/lib/utils";
import type { Listing } from "@/types/marketplace";
import { KindBadge, ListingImage, Price, RatingStars } from "./bits";

export function ShopLogo({ name, path, className = "size-14" }: { name: string; path: string | null; className?: string }) {
  const url = mediaUrl(path);
  const [first, second] = name.split(" ");
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-bond-slate font-display text-lg font-semibold text-white shadow-md ${className}`}
    >
      {url ? <Image src={url} alt={`${name} logo`} fill sizes="96px" className="object-cover" /> : initials(first, second)}
    </span>
  );
}

export function ShopCard({ shop, href }: { shop: ShopSummary; href?: string }) {
  return (
    <Link
      href={href ?? `/shops/${shop.slug}`}
      transitionTypes={["nav-forward"]}
      className="group flex h-full flex-col rounded-[26px] border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start gap-4">
        <ShopLogo name={shop.name} path={shop.logo_path} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-bold text-bond-ink transition-colors group-hover:text-bond-slate">
            {shop.name}
          </p>
          {shop.owner_name && <p className="truncate text-sm text-bond-ink/55">by {shop.owner_name}</p>}
          <div className="mt-1">
            <RatingStars rating={shop.rating} count={shop.reviewCount} />
          </div>
        </div>
      </div>
      {shop.tagline && <p className="mt-4 line-clamp-2 text-sm text-bond-ink/70">{shop.tagline}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {shop.kinds.map((kind) => (
          <span key={kind} className="rounded-full bg-bond-yellow/40 px-2.5 py-1 text-xs font-semibold text-bond-slate">
            {kindMeta[kind].plural}
          </span>
        ))}
        {shop.city && (
          <span className="inline-flex items-center gap-1 text-xs text-bond-ink/55">
            <MapPin className="size-3.5" aria-hidden /> {shop.city}
          </span>
        )}
        {Number(shop.delivery_fee) === 0 && shop.kinds.some((k) => k !== "service") && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <Truck className="size-3.5" aria-hidden /> Free delivery
          </span>
        )}
      </div>
    </Link>
  );
}

export function ListingCard({
  listing,
  href,
  shopName,
}: {
  listing: Pick<Listing, "id" | "kind" | "title" | "price" | "image_path" | "description">;
  href: string;
  shopName?: string;
}) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-bond-ink/8 bg-white shadow-[var(--shadow-card)] transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative overflow-hidden">
        <ListingImage
          path={listing.image_path}
          kind={listing.kind}
          alt={listing.title}
          className="aspect-[4/3] transition-transform duration-700 ease-smooth group-hover:scale-[1.04]"
        />
        <KindBadge kind={listing.kind} className="absolute top-3 left-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 font-heading font-semibold text-bond-ink">{listing.title}</p>
        {shopName && <p className="truncate text-xs text-bond-ink/55">{shopName}</p>}
        <p className="line-clamp-2 text-sm text-bond-ink/60">{listing.description}</p>
        <Price amount={listing.price} className="mt-auto pt-2 font-heading text-lg font-bold text-bond-slate" />
      </div>
    </Link>
  );
}
