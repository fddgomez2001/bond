import type { Metadata } from "next";
import { CustomerHome } from "@/components/dashboard/customer-home";
import { PageTransition } from "@/components/ui/page-transition";
import { isEmailConfirmed, requireRole } from "@/lib/auth/session";
import { listShops } from "@/lib/marketplace/catalog";
import { getMyOrders } from "@/lib/marketplace/customer-data";

export const metadata: Metadata = { title: "My BOND" };

export default async function CustomerDashboardPage({ searchParams }: PageProps<"/dashboard/customer">) {
  const [{ user, profile }, params, emailConfirmed] = await Promise.all([
    requireRole("customer"),
    searchParams,
    isEmailConfirmed(),
  ]);
  const [{ orders, bookings }, shops] = await Promise.all([getMyOrders(), listShops()]);
  // Best-rated shops first, then the ones with the most to offer.
  const popular = [...shops]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount || b.listingCount - a.listingCount)
    .slice(0, 6);

  return (
    <PageTransition>
      <CustomerHome
        profile={profile}
        email={user.email}
        emailConfirmed={emailConfirmed}
        justVerified={params.welcome === "1"}
        orders={orders}
        bookings={bookings}
        shops={popular}
      />
    </PageTransition>
  );
}
