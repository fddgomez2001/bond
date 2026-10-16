import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { EventBooking, Order, OrderEvent, OrderItem, Report, Review, Shop } from "@/types/marketplace";
import type { ListingKind } from "./constants";

/** Reads for the signed-in customer. RLS limits every query to their own rows. */

export type CartLine = {
  listingId: string;
  quantity: number;
  title: string;
  price: number;
  imagePath: string | null;
  available: boolean;
  shop: Pick<Shop, "id" | "slug" | "name" | "delivery_fee"> | null;
};

export async function getCart() {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_items")
    .select("listing_id, quantity, listing:listings(id, title, price, image_path, kind, status, is_active, shop:shops(id, slug, name, delivery_fee, is_open))")
    .eq("customer_id", user.id)
    .order("added_at", { ascending: true });

  type Row = {
    listing_id: string;
    quantity: number;
    listing: {
      id: string; title: string; price: number; image_path: string | null; kind: ListingKind; status: string; is_active: boolean;
      shop: (Pick<Shop, "id" | "slug" | "name" | "delivery_fee"> & { is_open: boolean }) | null;
    } | null;
  };

  const lines: CartLine[] = ((data ?? []) as unknown as Row[]).map((row) => ({
    listingId: row.listing_id,
    quantity: row.quantity,
    title: row.listing?.title ?? "Item no longer available",
    price: Number(row.listing?.price ?? 0),
    imagePath: row.listing?.image_path ?? null,
    available: Boolean(
      row.listing && row.listing.status === "approved" && row.listing.is_active && row.listing.kind === "gift" && row.listing.shop?.is_open,
    ),
    shop: row.listing?.shop
      ? { id: row.listing.shop.id, slug: row.listing.shop.slug, name: row.listing.shop.name, delivery_fee: Number(row.listing.shop.delivery_fee) }
      : null,
  }));

  const available = lines.filter((l) => l.available);
  const shop = available[0]?.shop ?? null;
  const subtotal = available.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const deliveryFee = shop ? shop.delivery_fee : 0;
  return { lines, shop, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export async function cartCount() {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const { data } = await supabase.from("cart_items").select("quantity").eq("customer_id", user.id);
  return (data ?? []).reduce((sum, r) => sum + (r.quantity as number), 0);
}

export type OrderSummary = Order & {
  shop: Pick<Shop, "name" | "slug"> | null;
  items: Pick<OrderItem, "title" | "quantity" | "image_path" | "service_category">[];
};

export type BookingSummary = EventBooking & { orders: OrderSummary[] };

const ORDER_LIST_FIELDS = "*, shop:shops(name, slug), items:order_items(title, quantity, image_path, service_category)";

export async function getMyOrders() {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const [{ data: orders }, { data: bookings }] = await Promise.all([
    supabase.from("orders").select(ORDER_LIST_FIELDS).eq("customer_id", user.id).is("booking_id", null).order("created_at", { ascending: false }).limit(100),
    supabase
      .from("event_bookings")
      .select(`*, orders(${ORDER_LIST_FIELDS})`)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return { orders: (orders ?? []) as OrderSummary[], bookings: (bookings ?? []) as BookingSummary[] };
}

export async function getMyOrder(orderId: string) {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, shop:shops(id, name, slug, contact_number)")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: events }, { data: review }, { data: reports }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase.from("order_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    supabase.from("reviews").select("*").eq("order_id", orderId).maybeSingle(),
    supabase.from("reports").select("*").eq("order_id", orderId).order("created_at", { ascending: false }),
  ]);
  return {
    order: order as Order & { shop: Pick<Shop, "id" | "name" | "slug" | "contact_number"> | null },
    items: (items ?? []) as OrderItem[],
    events: (events ?? []) as OrderEvent[],
    review: (review as Review | null) ?? null,
    reports: (reports ?? []) as Report[],
  };
}

export async function getMyBooking(bookingId: string) {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_bookings")
    .select(`*, orders(*, shop:shops(name, slug, contact_number), items:order_items(*))`)
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .maybeSingle();
  return (data as (EventBooking & { orders: (Order & { shop: Pick<Shop, "name" | "slug" | "contact_number"> | null; items: OrderItem[] })[] }) | null) ?? null;
}
