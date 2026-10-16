import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

/**
 * Sidebar layout for every admin page. It doesn't read the session itself
 * (the pages and the sidebar's streamed parts do), so it renders instantly
 * and stays put while you move between admin pages.
 */
export default function AdminLayout({ children }: LayoutProps<"/dashboard/admin">) {
  return (
    <WorkspaceShell label="Admin" homeHref="/dashboard/admin" sidebar={<AdminSidebar />}>
      {children}
    </WorkspaceShell>
  );
}
