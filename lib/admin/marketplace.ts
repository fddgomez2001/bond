import "server-only";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingStatus, Order, Report, Shop } from "@/types/marketplace";

/** Admin reads for listing approvals, orders and reports (admin RLS sees every row). */

export const listingStatuses: ListingStatus[] = ["pending_review", "approved", "rejected"];

export function parseListingStatus(value: unknown): ListingStatus {
  return listingStatuses.find((s) => s === value) ?? "pending_review";
}

export async function listListingsForReview(status: ListingStatus) {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data }, { data: all }] = await Promise.all([
    supabase
      .from("listings")
      .select("*, shop:shops(id, name, slug, owner_name)")
      .eq("status", status)
      .order("updated_at", { ascending: status === "pending_review" })
      .limit(200),
    supabase.from("listings").select("status"),
  ]);
  const counts = { pending_review: 0, approved: 0, rejected: 0 } as Record<ListingStatus, number>;
  for (const row of all ?? []) counts[row.status as ListingStatus] += 1;
  return {
    listings: (data ?? []) as (Listing & { shop: Pick<Shop, "id" | "name" | "slug" | "owner_name"> | null })[],
    counts,
  };
}

export async function listReports(status: "open" | "resolved") {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data }, { count: openCount }] = await Promise.all([
    supabase
      .from("reports")
      .select("*, order:orders(id, order_number, kind, total, status, payment_status, customer_name, customer_phone, recipient_name, delivery_address, scheduled_for, shop:shops(name, slug, contact_number))")
      .eq("status", status)
      .order("created_at", { ascending: status === "open" })
      .limit(200),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return {
    reports: (data ?? []) as (Report & {
      order: (Pick<Order, "id" | "order_number" | "kind" | "total" | "status" | "payment_status" | "customer_name" | "customer_phone" | "recipient_name" | "delivery_address" | "scheduled_for"> & {
        shop: Pick<Shop, "name" | "slug" | "contact_number"> | null;
      }) | null;
    })[],
    openCount: openCount ?? 0,
  };
}

export async function listAllOrders(status: string | null) {
  await requireRole("admin");
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, shop:shops(name, slug)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status) query = query.eq("status", status);
  const [{ data }, { data: all }] = await Promise.all([query, supabase.from("orders").select("status, payment_status, total")]);
  const totals = { held: 0, released: 0, refunded: 0, count: all?.length ?? 0 };
  for (const o of all ?? []) {
    if (o.payment_status === "held") totals.held += Number(o.total);
    if (o.payment_status === "released") totals.released += Number(o.total);
    if (o.payment_status === "refunded") totals.refunded += Number(o.total);
  }
  return { orders: (data ?? []) as (Order & { shop: Pick<Shop, "name" | "slug"> | null })[], totals };
}

/** Sidebar badges. */
export async function adminBadgeCounts() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ count: pendingVendors }, { count: pendingListings }, { count: openReports }] = await Promise.all([
    supabase.from("vendor_profiles").select("id", { count: "exact", head: true }).eq("business_verification_status", "pending_review"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return { vendors: pendingVendors ?? 0, listings: pendingListings ?? 0, reports: openReports ?? 0 };
}
