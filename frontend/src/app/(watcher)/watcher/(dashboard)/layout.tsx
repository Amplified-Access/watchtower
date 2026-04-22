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
import { AppSidebar } from "@/features/watcher/components/watcher-dashboard/app-sidebar";
import RouteGuard from "@/components/auth/route-guard";
import UserButton from "@/features/auth/components/user-button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();
  // console.log(session);
  if (!session || !(session.user.role == "watcher")) {
    router.push("/sign-in");
  }
  return (
    <RouteGuard
      allowedRoles={["watcher", "admin", "super-admin"]}
      requireOrganization={true}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar pr-4">
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
                      Watcher - Organization
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* <div className="ml-auto px-3">
              <NavActions />
            </div> */}
            <UserButton />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RouteGuard>
  );
};

export default Layout;
