import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getOwnVendorProfile, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { EventBooking, Listing, Order, OrderEvent, OrderItem, Report, Review, Shop } from "@/types/marketplace";
import { vendorActionStatuses, type ListingKind, type OrderStatus } from "./constants";

/**
 * The flow's "Account Verified?" gate: vendor tools need an approved
 * application. Unverified vendors are sent back to their status page.
 */
export async function requireApprovedVendor() {
  const { user, profile } = await requireRole("vendor");
  const vendor = await getOwnVendorProfile(user.id);
  if (vendor?.business_verification_status !== "approved") redirect("/dashboard/vendor");
  return { user, profile, vendor };
}

/** Sidebar state: whether tools are unlocked, and how many orders need the vendor. */
export async function vendorSidebarData() {
  const { user } = await requireRole("vendor");
  const vendor = await getOwnVendorProfile(user.id);
  const verified = vendor?.business_verification_status === "approved";
  if (!verified) return { verified, orders: 0 };
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("vendor_id", user.id).maybeSingle();
  if (!shop) return { verified, orders: 0 };
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .in("status", vendorActionStatuses);
  return { verified, orders: count ?? 0 };
}

/** The vendor's shop (read once per request). */
export const getMyShop = cache(async () => {
  const { user } = await requireRole("vendor");
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("vendor_id", user.id).maybeSingle<Shop>();
  return data ?? null;
});

export async function listMyListings(kinds: ListingKind[]) {
  const shop = await getMyShop();
  if (!shop) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("shop_id", shop.id)
    .in("kind", kinds)
    .order("created_at", { ascending: false });
  return (data ?? []) as Listing[];
}

export async function getMyListing(id: string) {
  const shop = await getMyShop();
  if (!shop) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*").eq("id", id).eq("shop_id", shop.id).maybeSingle<Listing>();
  return data ?? null;
}

export type VendorOrderRow = Order & {
  items: Pick<OrderItem, "title" | "quantity" | "service_category">[];
  booking: Pick<EventBooking, "booking_number" | "event_type" | "event_at" | "place" | "appointment_status" | "appointment_at"> | null;
};

export type OrderScope = "action" | "all" | "done";

export async function listShopOrders({ kind, scope }: { kind: ListingKind | "all"; scope: OrderScope }) {
  const shop = await getMyShop();
  if (!shop) return { orders: [] as VendorOrderRow[], counts: { gift: 0, surprise: 0, service: 0 } };
  const supabase = await createClient();
  // Unpaid orders aren't the shop's business yet.
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(title, quantity, service_category), booking:event_bookings(booking_number, event_type, event_at, place, appointment_status, appointment_at)")
    .eq("shop_id", shop.id)
    .neq("status", "awaiting_payment")
    .order("created_at", { ascending: false })
    .limit(300);
  const all = (data ?? []) as VendorOrderRow[];

  const needsAction = (o: VendorOrderRow) => vendorActionStatuses.includes(o.status as OrderStatus);
  const counts = { gift: 0, surprise: 0, service: 0 };
  for (const o of all) if (needsAction(o)) counts[o.kind] += 1;

  const orders = all.filter((o) => {
    if (kind !== "all" && o.kind !== kind) return false;
    if (scope === "action") return needsAction(o);
    if (scope === "done") return ["completed", "cancelled"].includes(o.status);
    return true;
  });
  return { orders, counts };
}

export async function getShopOrder(orderId: string) {
  const shop = await getMyShop();
  if (!shop) return null;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, booking:event_bookings(*)")
    .eq("id", orderId)
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }, { data: reports }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase.from("order_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    supabase.from("reports").select("*").eq("order_id", orderId),
  ]);
  return {
    order: order as Order & { booking: EventBooking | null },
    items: (items ?? []) as OrderItem[],
    events: (events ?? []) as OrderEvent[],
    reports: (reports ?? []) as Report[],
  };
}

/** Numbers for the vendor overview and Sales page. */
export async function getVendorStats() {
  const shop = await getMyShop();
  const empty = {
    shop,
    needsAction: 0,
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    held: 0,
    released: 0,
    refunded: 0,
    completedOrders: 0,
    activeOrders: 0,
    rating: null as number | null,
    reviewCount: 0,
    recentSales: [] as Order[],
  };
  if (!shop) return empty;
  const supabase = await createClient();
  const [{ data: orders }, { data: listings }, { data: reviews }] = await Promise.all([
    supabase.from("orders").select("*").eq("shop_id", shop.id).neq("status", "awaiting_payment").order("created_at", { ascending: false }).limit(1000),
    supabase.from("listings").select("status").eq("shop_id", shop.id),
    supabase.from("reviews").select("rating").eq("shop_id", shop.id),
  ]);
  const list = (orders ?? []) as Order[];
  const sum = (status: string) =>
    list.filter((o) => o.payment_status === status).reduce((total, o) => total + Number(o.total), 0);
  const ratings = (reviews ?? []).map((r) => r.rating as number);
  return {
    shop,
    needsAction: list.filter((o) => vendorActionStatuses.includes(o.status)).length,
    pendingListings: (listings ?? []).filter((l) => l.status === "pending_review").length,
    approvedListings: (listings ?? []).filter((l) => l.status === "approved").length,
    rejectedListings: (listings ?? []).filter((l) => l.status === "rejected").length,
    held: sum("held"),
    released: sum("released"),
    refunded: sum("refunded"),
    completedOrders: list.filter((o) => o.status === "completed").length,
    activeOrders: list.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
    recentSales: list.filter((o) => o.payment_status === "released").slice(0, 10),
  };
}

export async function listMyReviews() {
  const shop = await getMyShop();
  if (!shop) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
  return (data ?? []) as Review[];
}
