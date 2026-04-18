"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/_trpc/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useStore } from "@/app/context";
import { toast } from "sonner";
import { useEffect } from "react";

const AdminBreadcrumb = () => {
  const updateOrganization = useStore((state: any) => state.updateOrganization);

  const { data: session, isPending, error, refetch } = authClient.useSession();

  // Only run the query when session.user.id is available
  const adminOrg = trpc.getAdminOrganization.useQuery(
    { userId: session?.user?.id ?? "" },
    { enabled: !!session?.user?.id }
  );

  useEffect(() => {
    if (adminOrg.data !== undefined && session?.user) {
      updateOrganization(adminOrg.data ?? null);
    }
  }, [adminOrg.data, session, updateOrganization]);

  if (error || adminOrg.error) {
    toast.error("Failed to load organization data.");
    return <div>Error loading organization.</div>;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="line-clamp-1 flex">
            Admin -{" "}
            {isPending || adminOrg.isLoading ? (
              <p className="bg-muted-foreground/10 w-20 p-2 rounded-md animate-pulse ms-2" />
            ) : "organization" in (adminOrg?.data ?? {}) ? (
              (adminOrg.data as { organization: string | null }).organization
            ) : (
              "Unknown Organization"
            )}{" "}
            {/* {bears} */}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AdminBreadcrumb;
