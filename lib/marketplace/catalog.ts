import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FlowOption, Listing, ListingWithShop, Review, Shop } from "@/types/marketplace";
import type { EventType, ListingKind } from "./constants";

/**
 * Public catalogue reads. Row Level Security already hides closed shops,
 * unverified vendors and unapproved listings from everyone else; the
 * explicit filters below also keep a vendor's or admin's own drafts out
 * of public pages.
 */

export type ShopSummary = Pick<
  Shop,
  "id" | "slug" | "name" | "owner_name" | "tagline" | "city" | "offers" | "logo_path" | "delivery_fee"
> & { listingCount: number; kinds: ListingKind[]; rating: number | null; reviewCount: number };

const SHOP_FIELDS = "id, slug, name, owner_name, tagline, city, offers, logo_path, delivery_fee";

async function enrichShops(shops: Omit<ShopSummary, "listingCount" | "kinds" | "rating" | "reviewCount">[]) {
  if (shops.length === 0) return [];
  const supabase = await createClient();
  const ids = shops.map((s) => s.id);
  const [{ data: listings }, { data: reviews }] = await Promise.all([
    supabase.from("listings").select("shop_id, kind").in("shop_id", ids).eq("status", "approved").eq("is_active", true),
    supabase.from("reviews").select("shop_id, rating").in("shop_id", ids),
  ]);
  return shops.map((shop) => {
    const own = (listings ?? []).filter((l) => l.shop_id === shop.id);
    const ratings = (reviews ?? []).filter((r) => r.shop_id === shop.id).map((r) => r.rating as number);
    return {
      ...shop,
      listingCount: own.length,
      kinds: [...new Set(own.map((l) => l.kind as ListingKind))],
      rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      reviewCount: ratings.length,
    };
  });
}

/** Open shops of verified vendors, optionally filtered by what they offer and a search term. */
export async function listShops({ offer, query }: { offer?: ListingKind | null; query?: string } = {}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select(SHOP_FIELDS)
    .eq("is_open", true)
    .order("created_at", { ascending: false })
    .limit(300);

  const needle = query?.trim().toLowerCase();
  const shops = ((data ?? []) as ShopSummary[]).filter((shop) => {
    if (!needle) return true;
    return [shop.name, shop.owner_name, shop.city, shop.tagline].some((f) => f?.toLowerCase().includes(needle));
  });
  const enriched = await enrichShops(shops);
  // Only list shops that actually have something approved to show (for the chosen category).
  return enriched.filter((s) => s.listingCount > 0 && (!offer || s.kinds.includes(offer)));
}

export async function getShop(slug: string) {
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("is_open", true)
    .maybeSingle<Shop>();
  if (!shop) return null;

  const [{ data: listings }, { data: reviews }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("status", "approved")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const ratings = ((reviews ?? []) as Review[]).map((r) => r.rating);
  return {
    shop,
    listings: (listings ?? []) as Listing[],
    reviews: (reviews ?? []) as Review[],
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
  };
}

/** One approved listing with its (open) shop. */
export async function getListing(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, shop:shops!inner(id, slug, name, owner_name, city, delivery_fee, is_open)")
    .eq("id", id)
    .eq("status", "approved")
    .eq("is_active", true)
    .eq("shop.is_open", true)
    .maybeSingle();
  return (data as (ListingWithShop & { shop: { delivery_fee: number } }) | null) ?? null;
}

/** Approved listings of one kind across all open shops (surprise and event wizards). */
export async function listOptions(kind: ListingKind, eventType?: EventType): Promise<FlowOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, kind, title, description, price, image_path, service_category, event_types, inclusions, shop:shops!inner(id, slug, name, city, delivery_fee, is_open)")
    .eq("kind", kind)
    .eq("status", "approved")
    .eq("is_active", true)
    .eq("shop.is_open", true)
    .order("price", { ascending: true })
    .limit(500);
  const listings = ((data ?? []) as unknown as FlowOption[]).map((l) => ({
    ...l,
    price: Number(l.price),
    shop: { id: l.shop.id, slug: l.shop.slug, name: l.shop.name, city: l.shop.city, delivery_fee: Number(l.shop.delivery_fee) },
  }));
  return eventType
    ? listings.filter((l) => l.event_types.length === 0 || l.event_types.includes(eventType))
    : listings;
}
