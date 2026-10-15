import type { Metadata } from "next";
import { VendorRegistrationForm } from "@/components/auth/vendor-registration-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Vendor registration" };

export default function VendorSignupPage() {
  return <VendorRegistrationForm configured={isSupabaseConfigured()} />;
}
