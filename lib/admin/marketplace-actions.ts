"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/types/auth";

async function admin() {
  const account = await getCurrentAccount();
  return account?.profile?.role === "admin" ? account : null;
}

const notAdmin: FormState = { ok: false, message: "Only admins can do this." };

const listingReviewSchema = z
  .object({
    listingId: z.uuid(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().trim().max(2000),
  })
  .refine((v) => v.decision === "approved" || v.notes.length >= 5, {
    message: "Tell the vendor what to change (at least 5 characters).",
    path: ["notes"],
  });

/** Approve or reject a product/service. RLS only lets admins write these columns. */
export async function reviewListing(input: unknown): Promise<FormState> {
  const account = await admin();
  if (!account) return notAdmin;
  const parsed = listingReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the review.", fieldErrors: z.flattenError(parsed.error).fieldErrors as FormState["fieldErrors"] };
  }
  const { listingId, decision, notes } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: decision, review_notes: notes || null, reviewed_at: new Date().toISOString(), reviewed_by: account.user.id })
    .eq("id", listingId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn't save this review." };
  refresh();
  return { ok: true, message: decision === "approved" ? "Approved — it's now visible to customers." : "Rejected. The vendor can see your notes." };
}

const resolveSchema = z.object({
  reportId: z.uuid(),
  resolution: z.enum(["refund", "release"]),
  note: z.string().trim().min(5, "Explain the decision (at least 5 characters).").max(1000),
});

/** Refund the customer or release the held payment to the shop. */
export async function resolveReport(input: unknown): Promise<FormState> {
  const account = await admin();
  if (!account) return notAdmin;
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the decision.", fieldErrors: z.flattenError(parsed.error).fieldErrors as FormState["fieldErrors"] };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", {
    p_report: parsed.data.reportId,
    p_resolution: parsed.data.resolution,
    p_note: parsed.data.note,
  });
  if (error) return { ok: false, message: error.message?.length < 200 ? error.message : "We couldn't resolve this report." };
  refresh();
  return { ok: true, message: parsed.data.resolution === "refund" ? "Customer refunded." : "Payment released to the shop." };
}
