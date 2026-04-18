"use client";

import { trpc } from "@/_trpc/client";
import { DataTable } from "./organizations-table/data-table";
import { columns } from "./organizations-table/columns";
import { toast } from "sonner";
import PageLoader from "@/components/common/page-loader";

const OrganizationsContent = () => {
  const { data, isLoading, error } = trpc.getAllOrganizatons.useQuery();
  console.log("Organization data:", data);

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
              data={
                Array.isArray(data)
                  ? data.map((item) => ({
                      id: parseInt(item.id),
                      organizationName: item.name,
                      date:
                        "date" in item
                          ? (item as any).date
                          : item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "",
                    }))
                  : []
              }
            />
          </div>
        )}
      </>
    );
  }
};

export default OrganizationsContent;
