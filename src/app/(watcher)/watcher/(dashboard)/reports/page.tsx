"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Calendar,
  Download,
  Plus,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
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

const statusColors = {
  draft: "border-yellow-200 text-yellow-700 bg-yellow-50",
  published: "border-green-200 text-green-700 bg-green-50",
};

const page = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch user's organization data to get organization ID
  const { data: organizationData, isLoading: orgLoading } =
    trpc.getAdminOrganization.useQuery(
      { userId: user?.id || "" },
      { enabled: !!user?.id }
    );

  // Get organization ID from the data
  const organizationId =
    organizationData && "organization" in organizationData
      ? organizationData.organizationId
      : null;

  // Fetch reports for the watcher's organization
  const { data: reportsData, isLoading: reportsLoading } =
    trpc.getOrganizationReports.useQuery(
      {
        organizationId: organizationId || "",
        status:
          statusFilter === "all"
            ? "all"
            : (statusFilter as "draft" | "published"),
        limit: 50,
        offset: 0,
      },
      { enabled: !!organizationId }
    );

  // Filter reports to only show those created by the current watcher
  const myReports =
    reportsData?.reports?.filter(
      (report) => report.reportedById === user?.id
    ) || [];

  // Also get all published reports from the organization (readable by watcher)
  const { data: orgReportsData, isLoading: orgReportsLoading } =
    trpc.getOrganizationReports.useQuery(
      {
        organizationId: organizationId || "",
        status: "published",
        limit: 50,
        offset: 0,
      },
      { enabled: !!organizationId }
    );

  const organizationReports = orgReportsData?.reports || [];

  const isLoading =
    userLoading || orgLoading || reportsLoading || orgReportsLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
              Reports
            </h1>
            <p className="text-muted-foreground">
              View and manage your reports and access organization publications
            </p>
          </div>
          <Button asChild>
            <Link href="/watcher/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Report
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myReports.length}</div>
              <p className="text-xs text-muted-foreground">
                Reports you've created
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myReports.filter((r) => r.status === "published").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Your published reports
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myReports.filter((r) => r.status === "draft").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Reports in progress
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organization Reports
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationReports.length}
              </div>
              <p className="text-xs text-muted-foreground">Available to read</p>
            </CardContent>
          </Card>
        </div>

        {/* My Reports Section */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <FileText className="h-5 w-5" />
                My Reports
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search my reports..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {myReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No reports found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't created any reports yet"}
                </p>
                <Button asChild>
                  <Link href="/watcher/reports/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Report
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myReports
                    .filter((report) => {
                      if (!search) return true;
                      return report.title
                        .toLowerCase()
                        .includes(search.toLowerCase());
                    })
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              By {report.authorName || "Unknown"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              statusColors[
                                report.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(
                                new Date(report.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(report.updatedAt), "MMM dd, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/watcher/reports/${report.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                            {report.status === "published" && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Organization Reports Section */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-title text-lg">
              <BookOpen className="h-5 w-5" />
              Organization Reports
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Published reports from your organization
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {organizationReports.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No organization reports available
                </h3>
                <p className="text-muted-foreground">
                  Your organization hasn't published any reports yet
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Published report
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {report.authorName || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(report.updatedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/watcher/reports/${report.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default page;
