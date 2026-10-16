"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/session";
import { setFlash, type FlashKind } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/types/auth";

const reviewSchema = z
  .object({
    applicationId: z.uuid("Invalid application"),
    decision: z.enum(["approved", "needs_resubmission", "rejected"]),
    notes: z.string().trim().max(2000, "Keep notes under 2,000 characters"),
  })
  .superRefine((value, ctx) => {
    if (value.decision !== "approved" && value.notes.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["notes"],
        message: "Tell the vendor what needs to change (at least 5 characters).",
      });
    }
  });

const flashFor: Record<z.infer<typeof reviewSchema>["decision"], FlashKind> = {
  approved: "vendor-approved",
  needs_resubmission: "vendor-resubmission",
  rejected: "vendor-rejected",
};

/**
 * Records an admin's decision on a vendor application. The role is checked
 * here, and Postgres checks it again: only admins have an RLS policy that
 * lets them update review columns.
 */
export async function reviewVendorApplication(input: unknown): Promise<FormState> {
  const account = await getCurrentAccount();
  if (account?.profile?.role !== "admin") {
    return { ok: false, message: "Only admins can review vendor applications." };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the review details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as FormState["fieldErrors"],
    };
  }
  const { applicationId, decision, notes } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_profiles")
    .update({
      business_verification_status: decision,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: account.user.id,
    })
    .eq("id", applicationId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "We couldn't save this review. Refresh the page and try again." };
  }

  await setFlash(flashFor[decision]);
  redirect("/dashboard/admin/vendors");
}
