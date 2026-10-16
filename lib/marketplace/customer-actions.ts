"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/session";
import { setFlash } from "@/lib/flash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentSchema,
  deliverySchema,
  eventBookingSchema,
  paymentSchema,
  reportSchema,
  reviewSchema,
  surpriseSchema,
} from "@/lib/validations/marketplace";
import type { FormState } from "@/types/auth";
import { toPhIso } from "./constants";

/** Every customer action re-checks the session and role on the server. */
async function customer() {
  const account = await getCurrentAccount();
  return account?.profile?.role === "customer" ? account : null;
}

const notCustomer: FormState = { ok: false, message: "Log in with a customer account to continue." };

const invalid = (error: z.ZodError): FormState => ({
  ok: false,
  message: "Please check the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"],
});

/** Database functions raise friendly messages; anything else stays generic. */
function dbError(error: { message?: string; code?: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "42501" || /permission denied|row-level security/i.test(error.message ?? "")) {
    return "You don't have permission to do that.";
  }
  return error.message && error.message.length < 200 ? error.message : fallback;
}

// ---------------------------------------------------------------- cart

export type CartResult = FormState & { conflictShop?: string; count?: number };

export async function addToCart(input: { listingId: string; quantity: number; replace?: boolean }): Promise<CartResult> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = z
    .object({ listingId: z.uuid(), quantity: z.number().int().min(1).max(99), replace: z.boolean().optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid quantity." };
  const { listingId, quantity, replace } = parsed.data;

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, shop_id, kind, status, is_active")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.kind !== "gift" || listing.status !== "approved" || !listing.is_active) {
    return { ok: false, message: "This gift isn't available right now." };
  }

  // One shop per cart — matches "choose a store, then pick gifts".
  const { data: existing } = await supabase
    .from("cart_items")
    .select("listing_id, quantity, listing:listings(shop_id, shop:shops(name))")
    .eq("customer_id", account.user.id);
  type Row = { listing_id: string; quantity: number; listing: { shop_id: string; shop: { name: string } | null } | null };
  const rows = (existing ?? []) as unknown as Row[];
  const other = rows.find((r) => r.listing && r.listing.shop_id !== listing.shop_id);
  if (other && !replace) {
    return { ok: false, conflictShop: other.listing?.shop?.name ?? "another shop", message: "Your cart has items from another shop." };
  }
  if (other && replace) {
    await supabase.from("cart_items").delete().eq("customer_id", account.user.id);
  }

  const current = rows.find((r) => r.listing_id === listingId && !(other && replace));
  const { error } = await supabase.from("cart_items").upsert({
    customer_id: account.user.id,
    listing_id: listingId,
    quantity: Math.min(99, (current?.quantity ?? 0) + quantity),
  });
  if (error) return { ok: false, message: dbError(error, "We couldn't add this to your cart.") };

  refresh();
  return { ok: true, message: "Added to your cart." };
}

export async function updateCartItem(input: { listingId: string; quantity: number }): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = z.object({ listingId: z.uuid(), quantity: z.number().int().min(0).max(99) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid quantity." };

  const supabase = await createClient();
  const query = supabase.from("cart_items");
  const { error } =
    parsed.data.quantity === 0
      ? await query.delete().eq("customer_id", account.user.id).eq("listing_id", parsed.data.listingId)
      : await query.update({ quantity: parsed.data.quantity }).eq("customer_id", account.user.id).eq("listing_id", parsed.data.listingId);
  if (error) return { ok: false, message: dbError(error, "We couldn't update your cart.") };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- placing orders

export async function placeGiftOrder(shopId: string, input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  if (!z.uuid().safeParse(shopId).success) return { ok: false, message: "Your cart is empty." };
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_gift_order", {
    p_shop_id: shopId,
    p_recipient_name: d.recipientName,
    p_recipient_phone: d.recipientPhone,
    p_address: d.address,
    p_notes: d.notes ?? null,
    p_gift_message: d.giftMessage ?? null,
  });
  if (error || !data) return { ok: false, message: dbError(error, "We couldn't place your order.") };
  redirect(`/orders/${data}/pay`);
}

export async function placeSurpriseOrder(input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = surpriseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_surprise_order", {
    p_listing_id: d.listingId,
    p_scheduled_for: toPhIso(d.scheduledFor),
    p_recipient_name: d.recipientName,
    p_recipient_phone: d.recipientPhone,
    p_address: d.address,
    p_gift_message: d.giftMessage ?? null,
    p_notes: d.notes ?? null,
  });
  if (error || !data) return { ok: false, message: dbError(error, "We couldn't book this surprise.") };
  redirect(`/orders/${data}/pay`);
}

export async function placeEventBooking(input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = eventBookingSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_event_booking", {
    p_event_type: d.eventType,
    p_mode: d.mode,
    p_event_at: toPhIso(d.eventAt),
    p_place: d.place,
    p_guest_count: d.guestCount ?? null,
    p_notes: d.notes ?? null,
    p_listing_ids: d.listingIds,
  });
  if (error || !data) return { ok: false, message: dbError(error, "We couldn't book your event.") };
  redirect(`/bookings/${data}/pay`);
}

// ---------------------------------------------------------------- payment (test mode)

/** Simulated card that always fails, to try the "payment unsuccessful" path. */
const DECLINED_TEST_CARD = "4000000000000002";

export async function payNow(input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a payment method." };
  const { target, method, cardNumber } = parsed.data;

  const supabase = await createClient();
  // RLS: only the customer's own unpaid orders come back.
  const query = supabase.from("orders").select("id").eq("customer_id", account.user.id).eq("status", "awaiting_payment");
  const { data: orders } = await (target.type === "order" ? query.eq("id", target.id) : query.eq("booking_id", target.id));
  const orderIds = (orders ?? []).map((o) => o.id as string);
  if (orderIds.length === 0) return { ok: false, message: "There's nothing left to pay here." };

  if (method === "card") {
    const digits = (cardNumber ?? "").replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return { ok: false, fieldErrors: { cardNumber: ["Enter a card number"] }, message: "Check your card number." };
    }
    if (digits === DECLINED_TEST_CARD) {
      return { ok: false, message: "Payment declined by the card issuer. Try again or choose another method." };
    }
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Payments aren't available right now. Please try again later." };
  const { error } = await admin.rpc("confirm_payment", {
    p_customer: account.user.id,
    p_order_ids: orderIds,
    p_method: method,
    p_reference: `TEST-${randomBytes(5).toString("hex").toUpperCase()}`,
  });
  if (error) return { ok: false, message: "We couldn't confirm your payment. You haven't been charged." };

  await setFlash("payment-success");
  redirect(target.type === "order" ? `/orders/${target.id}` : `/bookings/${target.id}`);
}

// ---------------------------------------------------------------- after ordering

export async function customerOrderAction(input: { orderId: string; action: "cancel" | "confirm_received" }): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = z.object({ orderId: z.uuid(), action: z.enum(["cancel", "confirm_received"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("customer_order_action", { p_order: parsed.data.orderId, p_action: parsed.data.action });
  if (error) return { ok: false, message: dbError(error, "We couldn't update this order.") };
  refresh();
  return {
    ok: true,
    message: parsed.data.action === "cancel" ? "Order cancelled." : "Thanks for confirming! Tell us how it went.",
  };
}

export async function reportOrder(input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("customer_report_order", {
    p_order: parsed.data.orderId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details,
  });
  if (error) return { ok: false, message: dbError(error, "We couldn't send your report.") };
  refresh();
  return { ok: true, message: "Report sent. Your payment stays on hold while BOND reviews it." };
}

export async function reviewOrder(input: unknown): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("customer_review_order", {
    p_order: parsed.data.orderId,
    p_rating: parsed.data.rating,
    p_comment: parsed.data.comment ?? null,
  });
  if (error) return { ok: false, message: dbError(error, "We couldn't save your feedback.") };
  refresh();
  return { ok: true, message: "Thank you for using BOND!" };
}

export async function bookingAppointment(
  input: { bookingId: string; action: "skip" } | { bookingId: string; action: "request"; at: string; note?: string },
): Promise<FormState> {
  const account = await customer();
  if (!account) return notCustomer;

  const supabase = await createClient();
  if (input.action === "skip") {
    if (!z.uuid().safeParse(input.bookingId).success) return { ok: false, message: "Invalid booking." };
    const { error } = await supabase.rpc("customer_booking_appointment", { p_booking: input.bookingId, p_action: "skip" });
    if (error) return { ok: false, message: dbError(error, "We couldn't update your booking.") };
    refresh();
    return { ok: true, message: "No problem — your organizers already have your booking." };
  }

  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await supabase.rpc("customer_booking_appointment", {
    p_booking: parsed.data.bookingId,
    p_action: "request",
    p_at: toPhIso(parsed.data.at),
    p_note: parsed.data.note ?? null,
  });
  if (error) return { ok: false, message: dbError(error, "We couldn't request the appointment.") };
  refresh();
  return { ok: true, message: "Appointment request sent to your organizer." };
}
