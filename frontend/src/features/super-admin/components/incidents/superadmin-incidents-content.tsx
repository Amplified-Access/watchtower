"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Container from "@/components/common/container";
import Link from "next/link";

interface Incident {
  id: string;
  organizationId: string;
  formId: string;
  reportedByUserId: string;
  data: any;
  status: "reported" | "investigating" | "resolved" | "closed";
  createdAt: Date;
  updatedAt: Date;
  formName: string | null;
  organizationName: string | null;
  reporterEmail: string | null;
}

const statusColors: Record<
  "reported" | "investigating" | "resolved" | "closed",
  string
> = {
  reported: "bg-yellow-100 text-yellow-800 border-yellow-200",
  investigating: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const SuperAdminIncidentsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "status">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all organizations for filter dropdown
  const { data: organizations } = trpc.getAllOrganizatons.useQuery();

  // Fetch incidents with filters
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    error: incidentsError,
    refetch,
  } = trpc.getAllIncidentsForSuperAdmin.useQuery({
    search: search || undefined,
    status:
      statusFilter && statusFilter !== "all"
        ? (statusFilter as any)
        : undefined,
    organizationId:
      organizationFilter && organizationFilter !== "all"
        ? organizationFilter
        : undefined,
    sortBy,
    sortOrder,
    limit: 100,
    offset: 0,
  });

  const updateStatusMutation =
    trpc.updateIncidentStatusForSuperAdmin.useMutation({
      onSuccess: () => {
        toast.success("Incident status updated successfully");
        refetch();
      },
      onError: (error) => {
        toast.error("Failed to update incident status");
      },
    });

  const deleteIncidentMutation = trpc.deleteIncidentForSuperAdmin.useMutation({
    onSuccess: () => {
      toast.success("Incident deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete incident");
    },
  });

  const handleStatusUpdate = async (
    incidentId: string,
    newStatus: "reported" | "investigating" | "resolved" | "closed"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ incidentId, status: newStatus });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    try {
      await deleteIncidentMutation.mutateAsync({ incidentId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setOrganizationFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  if (userLoading || incidentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (incidentsError) {
    toast.error("Failed to load incidents");
    return (
      <div className="text-center text-red-500 py-8">
        Error loading incidents. Please try again.
      </div>
    );
  }

  if (user?.role !== "super-admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be a super admin to view all incidents.
        </p>
      </div>
    );
  }

  const incidents = incidentsData?.incidents || [];
  const totalCount = incidentsData?.totalCount || 0;

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-title pt-4 pb-2">
            All Incidents
          </h1>
          <p className="text-muted-foreground">
            {totalCount} total incident{totalCount !== 1 ? "s" : ""} across all
            organizations
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-none rounded-md">
        <CardContent className="flex justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-title text-nowrap">Search & Filters</CardTitle>
          </CardHeader>
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative h-fit">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Organization Filter */}
            <Select
              value={organizationFilter}
              onValueChange={setOrganizationFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {Array.isArray(organizations) &&
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 rounded-md"
                size={"icon"}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>

          {/* Clear Filters
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {(search ||
                statusFilter !== "all" ||
                organizationFilter !== "all") && (
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Clear filters
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {incidents.length} of {totalCount} incidents
            </p>
          </div> */}
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card className="shadow-none rounded-md">
        <CardContent className="p-0">
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No incidents found
              </h3>
              <p className="text-muted-foreground">
                {totalCount === 0
                  ? "No incidents have been reported yet"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-mono text-xs">
                      {incident.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {incident.organizationName || "Unknown Organization"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {incident.formName || "Unknown Form"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Object.keys(incident.data || {}).length} field(s)
                          submitted
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[
                            incident.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{incident.reporterEmail || "Unknown"}</TableCell>
                    <TableCell>
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(incident.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/superadmin/incidents/${incident.id}`}
                              className="flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(incident.id, "investigating")
                            }
                            disabled={incident.status === "investigating"}
                          >
                            Mark as Investigating
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(incident.id, "resolved")
                            }
                            disabled={incident.status === "resolved"}
                          >
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(incident.id, "closed")
                            }
                            disabled={incident.status === "closed"}
                          >
                            Mark as Closed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Incident
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the incident and remove all
                                  associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteIncident(incident.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default SuperAdminIncidentsContent;
