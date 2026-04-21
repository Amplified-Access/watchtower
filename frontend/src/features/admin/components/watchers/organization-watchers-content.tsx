"use client";
import { trpc } from "@/_trpc/client";
import Loader from "@/components/common/loader";
import { DataTable } from "./watchers-table/data-table";
import { columns } from "./watchers-table/columns";
import { toast } from "sonner";

const OrganizationWatchersContent = () => {
  const { data, isLoading, error } = trpc.getOrganizationWatchers.useQuery();

  console.log("Organization Watchers: ", data);

  if (error) {
    toast.error("An error occurred while fetching watchers");
    return (
      <div className="p-20 bg-muted rounded-full grid place-items-center">
        Error fetching watchers, try again later
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight font-title">
          Organization Watchers
        </h2>
        <div className="text-sm text-muted-foreground">
          {Array.isArray(data) ? data.length : 0} watchers found
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={
            Array.isArray(data)
              ? data.map((item) => ({
                  id: item.id,
                  name: item.name,
                  email: item.email,
                }))
              : []
          }
        />
      )}
    </div>
  );
};

export default OrganizationWatchersContent;
