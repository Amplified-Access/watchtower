"use client";
import { trpc } from "@/_trpc/client";
import PageLoader from "@/components/common/page-loader";
import { DataTable } from "./watchers-table/data-table";
import { columns } from "./watchers-table/columns";
import { toast } from "sonner";

const WatchersContent = () => {
  const { data, isLoading, error } = trpc.getAllWatchers.useQuery();

  console.log("Watchers: ", data);

  if (error) {
    toast.error("An error occured while fetching watchers");
    return (
      <div className="p-20 bg-muted rounded-full grid place-items-center">
        Error fetching watchers, try again later
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

export default WatchersContent;
