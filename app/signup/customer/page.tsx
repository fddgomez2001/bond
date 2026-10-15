import type { Metadata } from "next";
import { CustomerRegistrationForm } from "@/components/auth/customer-registration-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Customer sign-up" };

export default function CustomerSignupPage() {
  return <CustomerRegistrationForm configured={isSupabaseConfigured()} />;
}
