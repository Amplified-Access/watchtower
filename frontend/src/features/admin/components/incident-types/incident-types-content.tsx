"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/common/container";
import PageLoader from "@/components/common/page-loader";
import { trpc } from "@/_trpc/client";
import { toast } from "sonner";
import { CreateIncidentTypeDialog } from "./create-incident-type-dialog";

interface OrganizationIncidentType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isEnabled: boolean;
  organizationEnabledAt: Date;
}

interface AvailableIncidentType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentTypesContent = () => {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch organization's enabled incident types
  const {
    data: orgIncidentTypesData,
    isLoading: orgLoading,
    refetch: refetchOrgTypes,
  } = trpc.getOrganizationIncidentTypes.useQuery();

  // Fetch available incident types to enable
  const {
    data: availableIncidentTypesData,
    isLoading: availableLoading,
    refetch: refetchAvailable,
  } = trpc.getAvailableIncidentTypes.useQuery();

  // Enable existing incident type mutation
  const enableIncidentTypeMutation =
    trpc.enableIncidentTypeForOrganization.useMutation({
      onSuccess: () => {
        toast.success("Incident type enabled successfully");
        refetchOrgTypes();
        refetchAvailable();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to enable incident type");
      },
    });

  // Disable incident type mutation
  const disableIncidentTypeMutation =
    trpc.disableIncidentTypeForOrganization.useMutation({
      onSuccess: () => {
        toast.success("Incident type disabled successfully");
        refetchOrgTypes();
        refetchAvailable();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to disable incident type");
      },
    });

  const handleEnableIncidentType = async (incidentTypeId: string) => {
    try {
      await enableIncidentTypeMutation.mutateAsync({ incidentTypeId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDisableIncidentType = async (incidentTypeId: string) => {
    try {
      await disableIncidentTypeMutation.mutateAsync({ incidentTypeId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refetchOrgTypes();
    refetchAvailable();
  };

  const isLoading = orgLoading || availableLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  const organizationIncidentTypes = orgIncidentTypesData || [];
  const availableIncidentTypes = availableIncidentTypesData || [];

  // Enhanced filter function with multiple search criteria
  const filterIncidentTypes = (types: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return types;

    const searchLower = searchTerm.toLowerCase().trim();

    return types.filter((type) => {
      // Direct name match
      const nameMatch = type.name.toLowerCase().includes(searchLower);

      // Direct description match
      const descriptionMatch =
        type.description &&
        type.description.toLowerCase().includes(searchLower);

      // Word-based search (partial word matching)
      const searchWords = searchLower
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const wordMatch = searchWords.some(
        (word) =>
          type.name.toLowerCase().includes(word) ||
          (type.description && type.description.toLowerCase().includes(word))
      );

      return nameMatch || descriptionMatch || wordMatch;
    });
  };

  // Filter based on enhanced search
  const filteredOrgTypes = filterIncidentTypes(
    organizationIncidentTypes,
    search
  );
  const filteredAvailableTypes = filterIncidentTypes(
    availableIncidentTypes,
    search
  );

  return (
    <Container size="lg" className="space-y-6 pb-6">
      {/* Search and create in one row: the search takes the room the button
          leaves, filled with the muted grey. */}
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
      {/* Enabled Incident Types */}
      <section className="space-y-3">
        <h2 className="font-title text-lg font-semibold">
          Enabled for your organization
        </h2>
        <Card className="gap-0 overflow-hidden py-0 shadow-none">
          <CardContent className="overflow-auto p-0">
            {filteredOrgTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No incident types enabled yet. Enable one below, or create a
                new one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    {/* <TableHead>Enabled Date</TableHead> */}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgTypes.map((incidentType) => (
                    <TableRow key={incidentType.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: incidentType.color }}
                          />
                          {/* <span className="text-sm text-muted-foreground">
                            {incidentType.color}
                          </span> */}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {incidentType.name}
                      </TableCell>
                      <TableCell>
                        {incidentType.description &&
                        incidentType.description.length > 50 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="line-clamp-2 block max-w-xs text-ellipsis overflow-hidden cursor-pointer hover:text-blue-600">
                                {incidentType.description}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <p className="text-sm">
                                {incidentType.description}
                              </p>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="line-clamp-2 block max-w-xs">
                            {incidentType.description || "No description"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            incidentType.isActive ? "default" : "secondary"
                          }
                        >
                          {incidentType.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        {new Date(
                          incidentType.organizationEnabledAt
                        ).toLocaleDateString()}
                      </TableCell> */}
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={disableIncidentTypeMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Disable
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Disable Incident Type
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to disable "
                                {incidentType.name}" for your organization? This
                                will remove it from forms and may affect map
                                visibility.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDisableIncidentType(incidentType.id)
                                }
                              >
                                Disable
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
      {/* Available Incident Types */}
      <section className="space-y-3">
        <h2 className="font-title text-lg font-semibold">Available to enable</h2>
        <Card className="gap-0 overflow-hidden py-0 shadow-none">
          <CardContent className="overflow-auto p-0">
            {filteredAvailableTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No additional incident types available to enable.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    {/* <TableHead>Created Date</TableHead> */}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailableTypes.map((incidentType) => (
                    <TableRow key={incidentType.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: incidentType.color }}
                          />
                          {/* <span className="text-sm text-muted-foreground">
                            {incidentType.color}
                          </span> */}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {incidentType.name}
                      </TableCell>
                      <TableCell>
                        {incidentType.description &&
                        incidentType.description.length > 50 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="line-clamp-1 block max-w-96 text-ellipsis overflow-hidden cursor-pointer hover:text-blue-600">
                                {incidentType.description}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <p className="text-sm">
                                {incidentType.description}
                              </p>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="line-clamp-1 block max-w-96">
                            {incidentType.description || "No description"}
                          </span>
                        )}
                      </TableCell>
                      {/* <TableCell>
                        {new Date(incidentType.createdAt).toLocaleDateString()}
                      </TableCell> */}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleEnableIncidentType(incidentType.id)
                          }
                          disabled={enableIncidentTypeMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Enable
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
      {/* Create Dialog */}
      <CreateIncidentTypeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
};

export default IncidentTypesContent;
