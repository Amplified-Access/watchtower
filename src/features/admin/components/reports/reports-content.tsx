"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Trash2,
  Edit,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReport } from "@/utils/file-download";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
}

const statusColors: Record<"draft" | "published", string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const ReportsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"draft" | "published">(
    "draft"
  );
  const [isUploading, setIsUploading] = useState(false);

  // Fetch reports
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch,
  } = trpc.getOrganizationReports.useQuery(
    {
      organizationId: user?.organizationId || "",
      status:
        statusFilter === "all"
          ? "all"
          : (statusFilter as "draft" | "published"),
      limit: 100,
      offset: 0,
    },
    { enabled: !!user?.organizationId }
  );

  const createReportMutation = trpc.createReport.useMutation({
    onSuccess: () => {
      toast.success("Report uploaded successfully");
      refetch();
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadTitle("");
      setUploadStatus("draft");
    },
    onError: (error) => {
      toast.error("Failed to upload report");
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

  const deleteReportMutation = trpc.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete report");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is PDF
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      setSelectedFile(file);
      // Auto-fill title from filename (without extension)
      const filename = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(filename);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to Cloudflare
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error("File upload failed");
      }

      // Create report record
      await createReportMutation.mutateAsync({
        title: uploadTitle.trim(),
        fileKey: uploadResult.fileKey,
        status: uploadStatus,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload report");
    } finally {
      setIsUploading(false);
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

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportMutation.mutateAsync({ reportId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleDownload = (fileKey: string, title: string) => {
    downloadReport(fileKey, title);
  };

  if (userLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
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

  if (!user?.organizationId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be associated with an organization to view reports.
        </p>
      </div>
    );
  }

  const reports = reportsData?.reports || [];
  const totalCount = reportsData?.totalCount || 0;

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold font-title">Reports</h1>
          <p className="text-muted-foreground">
            {totalCount} total report{totalCount !== 1 ? "s" : ""} in your
            organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload New Report</DialogTitle>
                <DialogDescription>
                  Upload a PDF report to your organization's library.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter report title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={uploadStatus}
                    onValueChange={(value: "draft" | "published") =>
                      setUploadStatus(value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">PDF File</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? "Uploading..." : "Upload Report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-md shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
            <p className="text-sm text-muted-foreground">
              Showing {reports.length} of {totalCount} reports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="rounded-md shadow-none">
        <CardContent className="">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No reports found
              </h3>
              <p className="text-muted-foreground mb-4">
                {totalCount === 0
                  ? "Upload your first report to get started"
                  : "Try adjusting your filters"}
              </p>
              {totalCount === 0 && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Report
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
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
                                  and remove the associated file.
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

export default ReportsContent;
