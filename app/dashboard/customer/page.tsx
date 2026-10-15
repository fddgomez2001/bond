import type { Metadata } from "next";
import { CustomerHome } from "@/components/dashboard/customer-home";
import { isEmailConfirmed, requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My BOND" };

// Reads the session before rendering so signed-out users are redirected
// on the server instead of seeing a loading state.
export const instant = false;

export default async function CustomerDashboardPage({ searchParams }: PageProps<"/dashboard/customer">) {
  const [{ user, profile }, params, emailConfirmed] = await Promise.all([
    requireRole("customer"),
    searchParams,
    isEmailConfirmed(),
  ]);

  return (
    <CustomerHome
      profile={profile}
      email={user.email}
      emailConfirmed={emailConfirmed}
      justVerified={params.welcome === "1"}
    />
  );
}
