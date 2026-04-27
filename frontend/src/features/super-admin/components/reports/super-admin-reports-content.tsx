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
  Download,
  FileText,
  Building2,
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

interface Report {
  id: string;
  organizationId: string;
  reportedById: string;
  title: string;
  fileKey: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorEmail: string | null;
  organizationName: string | null;
}

const statusColors: Record<"draft" | "published", string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const SuperAdminReportsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");

  // Fetch all reports across organizations
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch,
  } = trpc.getAllReportsForSuperAdmin.useQuery(
    {
      status:
        statusFilter === "all"
          ? "all"
          : (statusFilter as "draft" | "published"),
      search: searchQuery.trim() || undefined,
      organizationId:
        organizationFilter === "all" ? undefined : organizationFilter,
      limit: 100,
      offset: 0,
    },
    { enabled: !!user && user.role === "super-admin" }
  );

  // Fetch organizations for filter
  const { data: organizationsData, isLoading: organizationsLoading } =
    trpc.getAllOrganizatons.useQuery(undefined, {
      enabled: !!user && user.role === "super-admin",
    });

  const deleteReportMutation = trpc.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete report");
    },
  });

  const updateReportMutation = trpc.updateReport.useMutation({
    onSuccess: () => {
      toast.success("Report updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update report");
    },
  });

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportMutation.mutateAsync({ reportId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleStatusToggle = async (
    reportId: string,
    currentStatus: "draft" | "published"
  ) => {
    const newStatus = currentStatus === "draft" ? "published" : "draft";
    try {
      await updateReportMutation.mutateAsync({
        reportId,
        status: newStatus,
      });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDownload = (fileKey: string, title: string) => {
    // Generate download URL for Cloudflare R2
    const downloadUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_URL}/${fileKey}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${title}.pdf`;
    link.click();
  };

  if (userLoading || reportsLoading || organizationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (user?.role !== "super-admin") {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Access denied. Superadmin role required.</p>
      </div>
    );
  }

  if (reportsError) {
    toast.error("Failed to load reports");
    return (
      <div className="text-center text-red-500 py-8">
        Error loading reports. Please try again.
      </div>
    );
  }

  const reports = reportsData?.reports || [];
  const totalCount = reportsData?.totalCount || 0;
  const organizations = organizationsData?.data && Array.isArray(organizationsData.data)
    ? organizationsData.data
    : [];

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold font-title pb-2">
            All Reports (Superadmin)
          </h1>
          <p className="text-muted-foreground">
            {totalCount} total report{totalCount !== 1 ? "s" : ""} across all
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
        <CardHeader className="">
          <CardTitle className="text-lg font-title">Filters</CardTitle>
        </CardHeader>
          <div className="flex gap-4">
            <div>
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={organizationFilter}
                onValueChange={setOrganizationFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations</SelectItem>
                  {organizations.map((org: { id: string; name: string }) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">
                Showing {reports.length} of {totalCount} reports
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="shadow-none rounded-md">
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No reports found
              </h3>
              <p className="text-muted-foreground">
                {totalCount === 0
                  ? "No reports have been uploaded yet"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {report.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {report.organizationName || "Unknown Organization"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[report.status as "draft" | "published"]
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {report.authorName || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.authorEmail || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(report.updatedAt).toLocaleDateString()}
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
                          <DropdownMenuItem
                            onClick={() =>
                              handleDownload(report.fileKey, report.title)
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusToggle(
                                report.id,
                                report.status as "draft" | "published"
                              )
                            }
                            disabled={updateReportMutation.isPending}
                          >
                            {report.status === "draft"
                              ? "Publish"
                              : "Mark as Draft"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Report
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the report "{report.title}"
                                  from {report.organizationName} and remove the
                                  associated file.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(report.id)}
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

export default SuperAdminReportsContent;
