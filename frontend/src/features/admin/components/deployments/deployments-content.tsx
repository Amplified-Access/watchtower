"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import PageLoader from "@/components/common/page-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeploymentsTable } from "@/features/deployments/components/deployments-table";
import { CreateDeploymentDialog } from "./create-deployment-dialog";

// The admin's deployments: their organization's maps, and creating one.
const DeploymentsContent = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error, refetch } =
    trpc.getOrganizationDeployments.useQuery();
  const updateStatus = trpc.updateDeploymentStatus.useMutation({
    onSuccess: (deployment) => {
      toast.success(
        deployment?.status === "live"
          ? `${deployment.name} is live`
          : deployment?.status === "closed"
            ? `${deployment.name} is closed`
            : "Moved back to draft"
      );
      refetch();
    },
    onError: (e) => toast.error(e.message || "Couldn't change the status"),
  });

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        Error loading deployments. Please try again.
      </div>
    );
  }

  const all = data ?? [];
  const query = search.trim().toLowerCase();
  const deployments = all.filter(
    (d) =>
      !query ||
      d.name.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query) ||
      d.country?.toLowerCase().includes(query)
  );

  return (
    <Container size="lg" className="space-y-6 pb-6">
      {/* Search and create in one row: the search takes the room the
          button leaves, filled with the muted grey. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-transparent shadow-none"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New deployment
        </Button>
      </div>

      <DeploymentsTable
        deployments={deployments}
        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        emptyMessage={
          all.length === 0 ? (
            <div className="space-y-1">
              <p className="font-medium text-foreground">No deployments yet</p>
              <p>
                A deployment is a map of your own: choose what it tracks and
                where, then share its reporting link.
              </p>
            </div>
          ) : (
            "No deployments match your search."
          )
        }
      />

      <CreateDeploymentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </Container>
  );
};

export default DeploymentsContent;
