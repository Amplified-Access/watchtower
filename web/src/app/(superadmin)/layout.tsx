import { cookies } from "next/headers";
import { ReactNode } from "react";

import RouteGuard from "@/components/auth/route-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppSidebar } from "@/features/super-admin/components/superadmin-dashboard/app-sidebar";
import { SuperAdminBreadcrumb } from "@/features/super-admin/components/superadmin-dashboard/superadmin-breadcrumb";

const Layout = async ({ children }: { children: ReactNode }) => {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <RouteGuard allowedRoles={["super-admin"]}>
      <DashboardShell
        sidebar={<AppSidebar />}
        title={<SuperAdminBreadcrumb />}
        defaultOpen={sidebarOpen}
      >
        {children}
      </DashboardShell>
    </RouteGuard>
  );
};

export default Layout;
