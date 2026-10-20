"use client";

import { trpc } from "@/_trpc/client";
import { DataTable } from "./organizations-table/data-table";
import { columns } from "./organizations-table/columns";
import { toast } from "sonner";
import PageLoader from "@/components/common/page-loader";

const OrganizationsContent = () => {
  // With each organization's deployment count, from the super admin route.
  const { data, isLoading, error } =
    trpc.getOrganizationsWithDeploymentCounts.useQuery();

  if (error) {
    toast.error("An error occured while fetching applications");
    return (
      <div className="p-20 bg-muted rounded-full grid place-items-center">
        Error fetching organizations, try again later
      </div>
    );
  } else {
    return (
      <>
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <DataTable
              columns={columns}
              data={(data ?? []).map((org) => ({
                id: org.id,
                organizationName: org.name,
                deploymentCount: org.deploymentCount,
                date: new Date(org.createdAt).toLocaleDateString(),
              }))}
            />
          </div>
        )}
      </>
    );
  }
};

export default OrganizationsContent;
