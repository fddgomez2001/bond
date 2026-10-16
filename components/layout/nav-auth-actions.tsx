import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { dashboardPathFor } from "@/lib/auth/routes";
import { getCurrentAccount } from "@/lib/auth/session";

const pill = "rounded-[15px] px-5 font-heading transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]";

export function GuestActions() {
  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-1 font-heading text-sm font-medium text-bond-slate transition-colors duration-300 hover:text-[#141414]"
      >
        Log in
      </Link>
      <Link href="/signup" className={buttonClasses({ variant: "primary", size: "sm", className: pill })}>
        Sign up
      </Link>
    </>
  );
}

/** Reads the session, so it must render inside <Suspense>. */
export async function NavAuthActions() {
  const account = await getCurrentAccount();
  if (!account) return <GuestActions />;

  return (
    <Link
      // Straight to the right dashboard (no /dashboard redirect hop), with
      // the forward page transition.
      href={dashboardPathFor(account.profile?.role)}
      transitionTypes={["nav-forward"]}
      className={buttonClasses({ variant: "primary", size: "sm", className: pill })}
      title="You're signed in"
    >
      <span className="relative">
        <LayoutDashboard className="size-4" aria-hidden />
        {/* Signed-in indicator */}
        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400 ring-2 ring-bond-slate" />
      </span>
      My dashboard
      <span className="sr-only">(signed in)</span>
    </Link>
  );
}
