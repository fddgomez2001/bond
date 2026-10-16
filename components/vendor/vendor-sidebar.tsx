import { Suspense } from "react";
import { AccountCard, AccountCardSkeleton, SidebarFrame } from "@/components/workspace/sidebar-parts";
import { WorkspaceNav, WorkspaceNavLinks } from "@/components/workspace/workspace-nav";
import { vendorSidebarData } from "@/lib/marketplace/vendor-data";

/** Vendor sidebar: tools stay locked until the application is approved. */
export function VendorSidebar() {
  return (
    <SidebarFrame
      label="Vendor"
      homeHref="/dashboard/vendor"
      nav={
        <Suspense fallback={<WorkspaceNavLinks workspace="vendor" section="main" />}>
          <MainNav />
        </Suspense>
      }
      account={
        <Suspense fallback={<AccountCardSkeleton />}>
          <AccountCard />
        </Suspense>
      }
      accountNav={
        <Suspense fallback={<WorkspaceNavLinks workspace="vendor" section="account" />}>
          <WorkspaceNav workspace="vendor" section="account" />
        </Suspense>
      }
    />
  );
}

async function MainNav() {
  const { verified, orders } = await vendorSidebarData();
  return <WorkspaceNav workspace="vendor" section="main" verified={verified} badges={{ orders }} />;
}
