/**
 * Hand-written types matching supabase/migrations. Once the project is
 * linked you can replace this with generated types:
 *   npx supabase gen types typescript --project-id <id> > types/supabase.ts
 */

export type UserRole = "customer" | "vendor" | "admin";

export type VerificationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_resubmission";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birthdate: string | null;
  contact_number: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  business_verification_status: VerificationStatus;
  selfie_path: string | null;
  government_id_path: string | null;
  proof_of_business_path: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdentityDocument {
  id: string;
  user_id: string;
  document_type: "government_id";
  storage_path: string;
  verification_status: VerificationStatus;
  created_at: string;
}
