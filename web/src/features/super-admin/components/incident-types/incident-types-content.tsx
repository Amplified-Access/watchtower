"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import PageLoader from "@/components/common/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateIncidentTypeDialog } from "@/features/admin/components/incident-types/create-incident-type-dialog";

// The super admin's incident types page: every type on the platform,
// active or not, and a way to create one. Unlike the admin's page, it says
// nothing about an organization's enabled set; a super admin has no
// organization.
const SuperAdminIncidentTypesContent = () => {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } =
    trpc.getAllIncidentTypesForSuperAdmin.useQuery();

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Error loading incident types. Please try again.
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const incidentTypes = (data ?? []).filter(
    (type) =>
      !query ||
      type.name.toLowerCase().includes(query) ||
      type.description?.toLowerCase().includes(query)
  );

  return (
    <Container size="lg" className="space-y-6 pb-6">
      {/* Search and create in one row, straight on the page: the search
          takes the room the button leaves, filled with the muted grey. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-transparent shadow-none"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New incident type
        </Button>
      </div>

      {/* A flush card, in the dashboards' card style */}
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        {incidentTypes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {query
              ? "No incident types match your search."
              : "No incident types yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidentTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div
                      className="size-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: type.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <span className="line-clamp-2 block max-w-md whitespace-normal">
                      {type.description || "No description"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(type.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateIncidentTypeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
        scope="platform"
      />
    </Container>
  );
};

export default SuperAdminIncidentTypesContent;
