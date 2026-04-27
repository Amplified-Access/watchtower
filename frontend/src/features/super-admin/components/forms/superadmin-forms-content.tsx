"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Trash2,
  Edit,
  Power,
  PowerOff,
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

interface Form {
  id: string;
  organizationId: string;
  name: string;
  definition: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationName: string | null;
  incidentCount: number;
}

const SuperAdminFormsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "name">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all organizations for filter dropdown
  const { data: organizations } = trpc.getAllOrganizatons.useQuery();

  // Fetch forms with filters
  const {
    data: formsData,
    isLoading: formsLoading,
    error: formsError,
    refetch,
  } = trpc.getAllFormsForSuperAdmin.useQuery({
    search: search || undefined,
    organizationId:
      organizationFilter && organizationFilter !== "all"
        ? organizationFilter
        : undefined,
    isActive:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
        ? false
        : undefined,
    sortBy,
    sortOrder,
    limit: 100,
    offset: 0,
  });

  const updateFormMutation = trpc.updateFormForSuperAdmin.useMutation({
    onSuccess: () => {
      toast.success("Form updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update form");
    },
  });

  const deleteFormMutation = trpc.deleteFormForSuperAdmin.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete form");
    },
  });

  const handleToggleStatus = async (formId: string, currentStatus: boolean) => {
    try {
      await updateFormMutation.mutateAsync({
        formId,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      await deleteFormMutation.mutateAsync({ formId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setOrganizationFilter("all");
    setStatusFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  if (userLoading || formsLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader size="32" />
      </div>
    );
  }

  if (formsError) {
    toast.error("Failed to load forms");
    return (
      <div className="text-center text-red-500 py-8">
        Error loading forms. Please try again.
      </div>
    );
  }

  if (user?.role !== "super-admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be a super admin to view all forms.
        </p>
      </div>
    );
  }

  const forms = formsData?.forms || [];
  const totalCount = formsData?.totalCount || 0;

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-title pt-4 pb-2">All Forms</h1>
          <p className="text-muted-foreground">
            {totalCount} total form{totalCount !== 1 ? "s" : ""} across all
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
            <CardTitle className="text-lg font-title text-nowrap">
              Search & Filters
            </CardTitle>
          </CardHeader>
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative h-fit">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search forms..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                {organizations?.data && Array.isArray(organizations.data) &&
                  organizations.data.map((org: any) => (
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
                  <SelectItem value="name">Name</SelectItem>
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
                organizationFilter !== "all" ||
                statusFilter !== "all") && (
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Clear filters
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {forms.length} of {totalCount} forms
            </p>
          </div> */}
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card className="shadow-none rounded-md">
        <CardContent className="p-0">
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No forms found
              </h3>
              <p className="text-muted-foreground">
                {totalCount === 0
                  ? "No forms have been created yet"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Incidents</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {form.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {form.organizationName || "Unknown Organization"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          form.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {form.incidentCount}
                        </span>
                        {(form.incidentCount ?? 0) > 0 && (
                          <Link
                            href={`/superadmin/incidents?formId=${form.id}`}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(form.updatedAt).toLocaleDateString()}
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
                              href={`/superadmin/forms/${form.id}`}
                              className="flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(form.id, form.isActive)
                            }
                            disabled={updateFormMutation.isPending}
                          >
                            {form.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Form
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the form "{form.name}" and
                                  remove all associated data.
                                  {(form.incidentCount ?? 0) > 0 && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                      <strong>Warning:</strong> This form has{" "}
                                      {form.incidentCount} associated incident
                                      {form.incidentCount !== 1 ? "s" : ""}.
                                      Delete incidents first.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteForm(form.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={(form.incidentCount ?? 0) > 0}
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

export default SuperAdminFormsContent;
