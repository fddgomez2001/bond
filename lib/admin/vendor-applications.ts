import "server-only";

import { requireRole } from "@/lib/auth/session";
import { authDetailsFor } from "./auth-users";
import { PRIVATE_DOCUMENTS_BUCKET, documentTypes, type DocumentType } from "@/lib/config/uploads";
import { createClient } from "@/lib/supabase/server";
import type { Profile, VendorProfile, VerificationStatus } from "@/types/database";

export const reviewStatuses: VerificationStatus[] = [
  "pending_review",
  "needs_resubmission",
  "approved",
  "rejected",
];

export function parseReviewStatus(value: unknown): VerificationStatus {
  return reviewStatuses.find((status) => status === value) ?? "pending_review";
}

type PersonFields = Pick<Profile, "id" | "first_name" | "last_name" | "contact_number" | "birthdate" | "created_at">;

export type VendorApplicationSummary = {
  id: string;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  contactNumber: string | null;
  email: string | null;
};

/** Number of applications waiting for review (sidebar badge). */
export async function countPendingApplications() {
  await requireRole("admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("vendor_profiles")
    .select("id", { count: "exact", head: true })
    .eq("business_verification_status", "pending_review");
  return count ?? 0;
}

/** Review queue for one status, plus how many applications are in each status. */
export async function listVendorApplications(status: VerificationStatus) {
  await requireRole("admin");
  const supabase = await createClient();

  // RLS: only admins can read every vendor_profiles row.
  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .order("submitted_at", { ascending: true, nullsFirst: false });
  const rows = (data ?? []) as VendorProfile[];

  const counts = Object.fromEntries(reviewStatuses.map((s) => [s, 0])) as Record<VerificationStatus, number>;
  for (const row of rows) counts[row.business_verification_status] += 1;

  const filtered = rows.filter((row) => row.business_verification_status === status);
  const userIds = filtered.map((row) => row.user_id);

  const [{ data: people }, auth] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, first_name, last_name, contact_number").in("id", userIds)
      : Promise.resolve({ data: [] as Pick<Profile, "id" | "first_name" | "last_name" | "contact_number">[] }),
    authDetailsFor(userIds),
  ]);
  const personById = new Map((people ?? []).map((p) => [p.id, p]));

  const applications: VendorApplicationSummary[] = filtered.map((row) => {
    const person = personById.get(row.user_id);
    return {
      id: row.id,
      status: row.business_verification_status,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      firstName: person?.first_name ?? null,
      lastName: person?.last_name ?? null,
      contactNumber: person?.contact_number ?? null,
      email: auth.get(row.user_id)?.email ?? null,
    };
  });

  return { counts, applications, loadError: Boolean(error) };
}

export type ApplicationDocument = {
  type: DocumentType;
  label: string;
  url: string | null;
  isPdf: boolean;
};

/** One application with its vendor's details and short-lived document links. */
export async function getVendorApplication(applicationId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: vendorData } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  const vendor = vendorData as VendorProfile | null;
  if (!vendor) return null;

  const personIds = [vendor.user_id, vendor.reviewed_by].filter((id): id is string => Boolean(id));
  const [{ data: people }, auth] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, contact_number, birthdate, created_at")
      .in("id", personIds),
    authDetailsFor([vendor.user_id]),
  ]);
  const personById = new Map(((people ?? []) as PersonFields[]).map((p) => [p.id, p]));
  const person = personById.get(vendor.user_id) ?? null;
  const reviewer = vendor.reviewed_by ? personById.get(vendor.reviewed_by) ?? null : null;

  // Signed with the admin's own session, so storage RLS still applies.
  // Links expire after 10 minutes and are never public.
  const paths: Record<DocumentType, string | null> = {
    selfie: vendor.selfie_path,
    government_id: vendor.government_id_path,
    proof_of_business: vendor.proof_of_business_path,
  };
  const existing = Object.values(paths).filter((p): p is string => Boolean(p));
  const signed = existing.length
    ? (await supabase.storage.from(PRIVATE_DOCUMENTS_BUCKET).createSignedUrls(existing, 600)).data ?? []
    : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));

  const documents: ApplicationDocument[] = (Object.keys(paths) as DocumentType[]).map((type) => {
    const path = paths[type];
    return {
      type,
      label: documentTypes[type].label,
      url: path ? urlByPath.get(path) ?? null : null,
      isPdf: Boolean(path?.toLowerCase().endsWith(".pdf")),
    };
  });

  return {
    vendor,
    person,
    email: auth.get(vendor.user_id)?.email ?? null,
    emailConfirmed: auth.get(vendor.user_id)?.emailConfirmed ?? false,
    reviewerName: reviewer ? [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ") || "Admin" : null,
    documents,
  };
}
