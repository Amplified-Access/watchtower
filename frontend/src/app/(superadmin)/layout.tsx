"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import UserButton from "@/features/auth/components/user-button";
import { AppSidebar } from "@/features/super-admin/components/superadmin-dashboard/app-sidebar";
import RouteGuard from "@/components/auth/route-guard";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RouteGuard allowedRoles={["super-admin"]}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-sidebar flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Super Admin
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <UserButton />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RouteGuard>
  );
};

export default Layout;
