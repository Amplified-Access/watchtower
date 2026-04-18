"use client";
import { trpc } from "@/_trpc/client";
import PageLoader from "@/components/common/page-loader";
import { DataTable } from "./admins-table/data-table";
import { columns } from "./admins-table/columns";
import { toast } from "sonner";

const AdminsContent = () => {
  const { data, isLoading, error } = trpc.getAllAdmins.useQuery();

  console.log("Admin: ", data);

  if (error) {
    toast.error("An error occured while fetching admins");
    return (
      <div className="p-20 bg-muted rounded-full grid place-items-center">
        Error fetching admins, try again later
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
              Array.isArray(data)
                ? data.map((item) => ({
                    ...item,
                    organization: item.organization ?? "",
                  }))
                : []
            }
          />
        )}
      </>
    );
  }
};

export default AdminsContent;
