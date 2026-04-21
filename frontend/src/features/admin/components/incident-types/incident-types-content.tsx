"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const organizationIncidentTypes = orgIncidentTypesData?.data || [];
  const availableIncidentTypes = availableIncidentTypesData?.data || [];

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
    <Container size="lg" className="py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-title pb-2">
            Incident Types
          </h1>
          <p className="text-muted-foreground">
            Manage your the incidents your organization reports on.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Type
        </Button>
      </div>
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white shadow-none "
          />
        </div>
      </div>
      {/* Enabled Incident Types */}
      <Card className="shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="font-title">
            Your Organization's enabled incident types
          </CardTitle>
          <CardDescription>
            Incident types currently enabled for your organization. These will
            appear on forms and maps.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          {filteredOrgTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incident types enabled yet. Enable existing types or create new
              ones below.
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
      {/* Available Incident Types */}
      <Card className="shadow-none rounded-md w-full overflow-auto">
        <CardHeader>
          <CardTitle className="font-title">Available Incident Types</CardTitle>
          <CardDescription>
            Existing incident types created by other organizations that you can
            enable for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
