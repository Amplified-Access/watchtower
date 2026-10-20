import { cookies } from "next/headers";
import { ReactNode } from "react";

import RouteGuard from "@/components/auth/route-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import AdminBreadcrumb from "@/features/admin/components/admin-dashboard/admin-breadcrumb";
import { AppSidebar } from "@/features/admin/components/admin-dashboard/app-sidebar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <RouteGuard
      allowedRoles={["admin", "super-admin"]}
      requireOrganization={true}
    >
      <DashboardShell
        sidebar={<AppSidebar />}
        title={<AdminBreadcrumb />}
        defaultOpen={sidebarOpen}
      >
        {children}
      </DashboardShell>
    </RouteGuard>
  );
};

export default Layout;
