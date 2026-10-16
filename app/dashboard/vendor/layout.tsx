import { VendorSidebar } from "@/components/vendor/vendor-sidebar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

/**
 * Sidebar layout for every vendor page. Like the admin layout it doesn't
 * read the session itself, so it renders instantly and stays put between pages.
 */
export default function VendorLayout({ children }: LayoutProps<"/dashboard/vendor">) {
  return (
    <WorkspaceShell label="Vendor" homeHref="/dashboard/vendor" sidebar={<VendorSidebar />}>
      {children}
    </WorkspaceShell>
  );
}
