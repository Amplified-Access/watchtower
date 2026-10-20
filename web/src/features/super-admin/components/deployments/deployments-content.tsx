"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import PageLoader from "@/components/common/page-loader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeploymentsTable } from "@/features/deployments/components/deployments-table";

const ALL = "all";
const filledControl = "bg-muted border-transparent shadow-none";

// The super admin's deployments: every organization's, filtered by
// organization. The filter lives in the URL (?organization=<id>), so the
// Organizations page can link an organization's count straight here.
const SuperAdminDeploymentsContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const organizationId = searchParams?.get("organization") ?? ALL;
  const [search, setSearch] = useState("");

  const { data: organizations } =
    trpc.getOrganizationsWithDeploymentCounts.useQuery();
  const { data, isLoading, error } = trpc.getAllDeployments.useQuery({
    organizationId: organizationId === ALL ? undefined : organizationId,
  });

  const setOrganization = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (id === ALL) params.delete("organization");
    else params.set("organization", id);
    const qs = params.toString();
    const path = pathname ?? "/superadmin/deployments";
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  const query = search.trim().toLowerCase();
  const deployments = (data ?? []).filter(
    (d) =>
      !query ||
      d.name.toLowerCase().includes(query) ||
      d.organizationName?.toLowerCase().includes(query) ||
      d.country?.toLowerCase().includes(query)
  );

  return (
    <Container size="lg" className="space-y-6 pb-6">
      {/* Search and the organization filter in one row, filled with the
          muted grey; the search takes the room the filter leaves. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-9 ${filledControl}`}
          />
        </div>
        <Select value={organizationId} onValueChange={setOrganization}>
          <SelectTrigger className={`w-full sm:w-64 ${filledControl}`}>
            <SelectValue placeholder="All organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All organizations</SelectItem>
            {(organizations ?? []).map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name} ({org.deploymentCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="py-8 text-center text-red-500">
          Error loading deployments. Please try again.
        </div>
      ) : (
        <DeploymentsTable
          deployments={deployments}
          showOrganization
          emptyMessage={
            query
              ? "No deployments match your search."
              : organizationId !== ALL
                ? "This organization hasn't created a deployment yet."
                : "No organization has created a deployment yet."
          }
        />
      )}
    </Container>
  );
};

export default SuperAdminDeploymentsContent;
