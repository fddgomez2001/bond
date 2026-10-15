import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { features } from "@/lib/config/features";
import { clearPendingVerification, markRecoverySession } from "@/lib/auth/pending-verification";
import { setFlash } from "@/lib/flash";
import { safeNextPath } from "@/lib/security/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Landing point for links in Supabase emails. Handles both:
 *  - token_hash + type (recommended template, works in any browser), and
 *  - ?code= (default PKCE link, must be opened in the same browser).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const rawType = params.get("type");
  const type = EMAIL_OTP_TYPES.find((t) => t === rawType) ?? null;
  const code = params.get("code");
  const next = safeNextPath(params.get("next"), "/dashboard");
  const isRecovery = type === "recovery" || next === "/reset-password";

  if (!isSupabaseConfigured()) redirect("/login");
  if (isRecovery && !features.passwordRecovery) redirect("/forgot-password");

  // Supabase already rejected the link (used, expired or replaced by a newer
  // email) and sent the user here with ?error=…&error_code=….
  if (params.get("error") || params.get("error_code")) {
    redirect(isRecovery ? "/forgot-password?error=link-invalid" : "/verify-email?error=link-expired");
  }

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) {
    redirect(isRecovery ? "/forgot-password?error=link-invalid" : "/verify-email?error=link-invalid");
  }

  if (isRecovery) {
    await markRecoverySession();
    redirect("/reset-password");
  }

  await clearPendingVerification();
  await setFlash("verified");
  redirect(next === "/dashboard" ? "/dashboard?welcome=1" : next);
}
