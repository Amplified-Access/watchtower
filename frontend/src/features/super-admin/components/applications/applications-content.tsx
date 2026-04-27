"use client";
import { trpc } from "@/_trpc/client";
import PageLoader from "@/components/common/page-loader";
import { DataTable } from "./applications-table/data-table";
import { columns } from "./applications-table/columns";
import { toast } from "sonner";

const ApplicationsContent = () => {
  const { data, isLoading, error } =
    trpc.getAllOrganizatonApplications.useQuery();
  console.log(data);

  if (error) {
    toast.error("An error occured while fetching applications");
    return (
      <div className="p-20 bg-muted rounded-full grid place-items-center">
        Error fetching applications, try again later
      </div>
    );
  } else {
    return (
      <>
        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            data={
              data?.data && Array.isArray(data.data)
                ? data.data.map((item: any) => ({
                    ...item,
                    website: item.website ?? "",
                    certificateOfIncorporation:
                      item.certificateOfIncorporation ?? "",
                    status: item.status as "pending" | "approved" | "rejected",
                    date:
                      "date" in item
                        ? item.date
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "",
                  }))
                : []
            }
          />
        )}
      </>
    );
  }
};

export default ApplicationsContent;
