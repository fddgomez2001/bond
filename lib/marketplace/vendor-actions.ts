"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAccount, getOwnVendorProfile } from "@/lib/auth/session";
import { IMAGE_MIME_TYPES } from "@/lib/config/uploads";
import { setFlash } from "@/lib/flash";
import { validateUpload } from "@/lib/security/file-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listingSchema, shopSchema } from "@/lib/validations/marketplace";
import type { FormState } from "@/types/auth";
import { PUBLIC_MEDIA_BUCKET } from "./media";

/** Vendor actions require a verified (approved) vendor, checked on every call. */
async function approvedVendor() {
  const account = await getCurrentAccount();
  if (account?.profile?.role !== "vendor") return null;
  const vendor = await getOwnVendorProfile(account.user.id);
  return vendor?.business_verification_status === "approved" ? account : null;
}

const notVerified: FormState = { ok: false, message: "Your vendor account needs to be verified first." };

const invalid = (error: z.ZodError): FormState => ({
  ok: false,
  message: "Please check the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"],
});

function dbError(error: { message?: string; code?: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "42501" || /permission denied|row-level security/i.test(error.message ?? "")) {
    return "You don't have permission to do that.";
  }
  return error.message && error.message.length < 200 ? error.message : fallback;
}

/** Validates and stores an optional image in the public bucket; returns its path. */
async function storeImage(file: FormDataEntryValue | null, folder: string, label: string) {
  const result = await validateUpload(file, { label, accept: IMAGE_MIME_TYPES, required: false });
  if (result.error) return { error: result.error };
  if (!result.file) return { path: null };
  const admin = createAdminClient();
  if (!admin) return { error: "Image uploads aren't available right now." };
  const path = `${folder}/${Date.now()}-${randomBytes(4).toString("hex")}.${result.file.extension}`;
  const { error } = await admin.storage
    .from(PUBLIC_MEDIA_BUCKET)
    .upload(path, result.file.bytes, { contentType: result.file.mimeType, upsert: false });
  if (error) return { error: "We couldn't upload the image. Please try again." };
  return { path };
}

async function removeImage(path: string | null) {
  if (!path) return;
  await createAdminClient()?.storage.from(PUBLIC_MEDIA_BUCKET).remove([path]);
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length >= 3 ? base : `${base || "shop"}-shop`;
}

// ---------------------------------------------------------------- shop

export async function saveShop(formData: FormData): Promise<FormState> {
  const account = await approvedVendor();
  if (!account) return notVerified;

  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? undefined,
    description: formData.get("description") ?? undefined,
    city: formData.get("city") ?? undefined,
    contactNumber: formData.get("contactNumber") ?? "",
    deliveryFee: formData.get("deliveryFee") ?? 0,
    offers: formData.getAll("offers"),
    isOpen: formData.get("isOpen") === "on" || formData.get("isOpen") === "true",
  });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const fields = {
    name: d.name,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    city: d.city ?? null,
    contact_number: d.contactNumber ?? null,
    delivery_fee: d.deliveryFee,
    offers: d.offers,
    is_open: d.isOpen,
  };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("shops").select("id, logo_path").eq("vendor_id", account.user.id).maybeSingle();

  let shopId = existing?.id as string | undefined;
  if (shopId) {
    const { error } = await supabase.from("shops").update(fields).eq("id", shopId);
    if (error) return { ok: false, message: dbError(error, "We couldn't save your shop.") };
  } else {
    // Retry with a suffix if the address (slug) is taken.
    for (let attempt = 0; attempt < 4 && !shopId; attempt++) {
      const slug = attempt === 0 ? slugify(d.name) : `${slugify(d.name).slice(0, 52)}-${randomBytes(2).toString("hex")}`;
      const { data, error } = await supabase
        .from("shops")
        .insert({ ...fields, vendor_id: account.user.id, slug })
        .select("id")
        .single();
      if (data) shopId = data.id as string;
      else if (error?.code !== "23505") return { ok: false, message: dbError(error, "We couldn't create your shop.") };
    }
    if (!shopId) return { ok: false, message: "That shop name is taken. Try a slightly different one." };
  }

  const logo = await storeImage(formData.get("logo"), `shops/${shopId}`, "Shop logo");
  if (logo.error) return { ok: false, message: logo.error, fieldErrors: { logo: [logo.error] } };
  if (logo.path) {
    const admin = createAdminClient();
    await admin?.from("shops").update({ logo_path: logo.path }).eq("id", shopId);
    await removeImage((existing?.logo_path as string | null) ?? null);
  }

  refresh();
  return { ok: true, message: existing ? "Shop updated." : "Your shop is live! Add your first product or service." };
}

// ---------------------------------------------------------------- listings

export async function saveListing(formData: FormData): Promise<FormState> {
  const account = await approvedVendor();
  if (!account) return notVerified;

  const id = formData.get("id");
  const parsed = listingSchema.safeParse({
    kind: formData.get("kind"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    serviceCategory: formData.get("serviceCategory") || undefined,
    eventTypes: formData.getAll("eventTypes"),
    inclusions: formData
      .getAll("inclusions")
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean),
    isActive: formData.get("isActive") !== "false",
  });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const isService = d.kind === "service";

  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("vendor_id", account.user.id).maybeSingle();
  if (!shop) return { ok: false, message: "Set up your shop first." };

  const fields = {
    kind: d.kind,
    title: d.title,
    description: d.description,
    price: d.price,
    service_category: isService ? d.serviceCategory : null,
    event_types: isService ? d.eventTypes : [],
    inclusions: isService ? d.inclusions : [],
    is_active: d.isActive,
  };

  let listingId: string;
  let oldImage: string | null = null;
  if (typeof id === "string" && id) {
    if (!z.uuid().safeParse(id).success) return { ok: false, message: "Listing not found." };
    const { data: current } = await supabase.from("listings").select("image_path").eq("id", id).eq("shop_id", shop.id).maybeSingle();
    if (!current) return { ok: false, message: "Listing not found." };
    oldImage = current.image_path as string | null;
    const { error } = await supabase.from("listings").update(fields).eq("id", id).eq("shop_id", shop.id);
    if (error) return { ok: false, message: dbError(error, "We couldn't save this listing.") };
    listingId = id;
  } else {
    const { data, error } = await supabase
      .from("listings")
      .insert({ ...fields, shop_id: shop.id })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: dbError(error, "We couldn't create this listing.") };
    listingId = data.id as string;
  }

  const image = await storeImage(formData.get("image"), `listings/${shop.id}`, "Photo");
  if (image.error) return { ok: false, message: image.error, fieldErrors: { image: [image.error] } };
  if (image.path) {
    // Set by the server; a new photo also sends the listing back to review.
    await createAdminClient()?.from("listings").update({ image_path: image.path }).eq("id", listingId);
    await removeImage(oldImage);
  }

  await setFlash("listing-submitted");
  redirect(isService ? "/dashboard/vendor/services" : "/dashboard/vendor/products");
}

export async function setListingActive(input: { listingId: string; active: boolean }): Promise<FormState> {
  const account = await approvedVendor();
  if (!account) return notVerified;
  const parsed = z.object({ listingId: z.uuid(), active: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ is_active: parsed.data.active })
    .eq("id", parsed.data.listingId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: dbError(error, "We couldn't update this listing.") };
  refresh();
  return { ok: true, message: parsed.data.active ? "Listing is visible again." : "Listing hidden from customers." };
}

export async function deleteListing(input: { listingId: string }): Promise<FormState> {
  const account = await approvedVendor();
  if (!account) return notVerified;
  const parsed = z.object({ listingId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  // RLS limits this to the vendor's own listings; past orders keep their own copy.
  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", parsed.data.listingId)
    .select("image_path")
    .maybeSingle();
  if (error || !data) return { ok: false, message: dbError(error, "We couldn't delete this listing.") };
  await removeImage((data.image_path as string | null) ?? null);
  refresh();
  return { ok: true, message: "Listing deleted." };
}

// ---------------------------------------------------------------- orders

const orderActionSchema = z.object({
  orderId: z.uuid(),
  action: z.enum(["start_preparing", "mark_ready", "mark_delivered", "delivery_failed", "retry_delivery", "confirm", "mark_completed", "decline"]),
  note: z.string().trim().max(300).optional(),
});

export async function vendorOrderAction(input: unknown): Promise<FormState> {
  const account = await approvedVendor();
  if (!account) return notVerified;
  const parsed = orderActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("vendor_order_action", {
    p_order: parsed.data.orderId,
    p_action: parsed.data.action,
    p_note: parsed.data.note || null,
  });
  if (error) return { ok: false, message: dbError(error, "We couldn't update this order.") };
  refresh();
  return { ok: true, message: "Order updated. The customer can see the new status." };
}
