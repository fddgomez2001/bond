import { Suspense } from "react";
import { AccountCard, AccountCardSkeleton, SidebarFrame } from "@/components/workspace/sidebar-parts";
import { WorkspaceNav, WorkspaceNavLinks } from "@/components/workspace/workspace-nav";
import { adminBadgeCounts } from "@/lib/admin/marketplace";

/** Admin sidebar: the frame renders instantly; badges and account stream in. */
export function AdminSidebar() {
  return (
    <SidebarFrame
      label="Admin"
      homeHref="/dashboard/admin"
      nav={
        <Suspense fallback={<WorkspaceNavLinks workspace="admin" section="main" />}>
          <MainNav />
        </Suspense>
      }
      account={
        <Suspense fallback={<AccountCardSkeleton />}>
          <AccountCard />
        </Suspense>
      }
      accountNav={
        <Suspense fallback={<WorkspaceNavLinks workspace="admin" section="account" />}>
          <WorkspaceNav workspace="admin" section="account" />
        </Suspense>
      }
    />
  );
}

async function MainNav() {
  const badges = await adminBadgeCounts();
  return <WorkspaceNav workspace="admin" section="main" badges={badges} />;
}
