import { cookies } from "next/headers";
import { ReactNode } from "react";

import RouteGuard from "@/components/auth/route-guard";
import {
  DashboardShell,
  DashboardTitle,
} from "@/components/dashboard/dashboard-shell";
import { AppSidebar } from "@/features/watcher/components/watcher-dashboard/app-sidebar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <RouteGuard
      allowedRoles={["watcher", "admin", "super-admin"]}
      requireOrganization={true}
    >
      <DashboardShell
        sidebar={<AppSidebar />}
        title={<DashboardTitle>Watcher - Organization</DashboardTitle>}
        defaultOpen={sidebarOpen}
      >
        {children}
      </DashboardShell>
    </RouteGuard>
  );
};

export default Layout;
