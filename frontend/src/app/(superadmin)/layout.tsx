import { cookies } from "next/headers";
import { ReactNode } from "react";

import RouteGuard from "@/components/auth/route-guard";
import {
  DashboardShell,
  DashboardTitle,
} from "@/components/dashboard/dashboard-shell";
import { AppSidebar } from "@/features/super-admin/components/superadmin-dashboard/app-sidebar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <RouteGuard allowedRoles={["super-admin"]}>
      <DashboardShell
        sidebar={<AppSidebar />}
        title={<DashboardTitle>Super Admin</DashboardTitle>}
        defaultOpen={sidebarOpen}
      >
        {children}
      </DashboardShell>
    </RouteGuard>
  );
};

export default Layout;
