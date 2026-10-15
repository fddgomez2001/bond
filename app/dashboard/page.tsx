import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonClasses } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { dashboardPathFor } from "@/lib/auth/routes";
import { getCurrentAccount } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };
export const instant = false;

/** Sends each signed-in user to the dashboard for their role. */
export default async function DashboardRouterPage({ searchParams }: PageProps<"/dashboard">) {
  const [account, params] = await Promise.all([getCurrentAccount(), searchParams]);
  if (!account) redirect("/login");

  const role = account.profile?.role;
  if (role === "customer" || role === "vendor") {
    redirect(`${dashboardPathFor(role)}${params.welcome === "1" ? "?welcome=1" : ""}`);
  }

  const isAdmin = role === "admin";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-bond-yellow px-4 py-16">
      <Logo tone="light" />
      <div className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-2xl">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-bond-yellow/60 text-bond-slate">
          <ShieldAlert className="size-7" aria-hidden />
        </span>
        {isAdmin ? (
          <>
            <h1 className="mt-5 font-heading text-2xl font-bold text-bond-ink">Admin tools are coming soon</h1>
            <p className="mt-2 text-bond-ink/65">
              Vendor document review will be added in a later phase. Until then, review applications in the
              Supabase dashboard.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-heading text-2xl font-bold text-bond-ink">We couldn&apos;t load your profile</h1>
            <p className="mt-2 text-bond-ink/65">
              {account.profileError
                ? "Your profile couldn't be read. If you're setting up BOND, make sure the database migrations have been run."
                : "Your account doesn't have a BOND profile yet. Please contact support so we can fix it."}
            </p>
          </>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonClasses({ variant: "outline" })}>
            Back to home
          </Link>
          <form action={signOut}>
            <Button type="submit" className="w-full">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
