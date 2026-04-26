"use client"
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminBreadcrumb from "@/features/admin/components/admin-dashboard/admin-breadcrumb";
import { AppSidebar } from "@/features/admin/components/admin-dashboard/app-sidebar";
import UserButton from "@/features/auth/components/user-button";
import RouteGuard from "@/components/auth/route-guard";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <RouteGuard
      allowedRoles={["admin", "super-admin"]}
      requireOrganization={true}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <AdminBreadcrumb />
              <UserButton />
            </div>
          </header>
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RouteGuard>
  );
};

export default Layout;
