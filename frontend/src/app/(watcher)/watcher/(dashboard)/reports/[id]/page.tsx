"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  Calendar,
  User,
  Download,
  Clock,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";

const statusColors = {
  draft: "border-yellow-200 text-yellow-700 bg-yellow-50",
  published: "border-green-200 text-green-700 bg-green-50",
};

const Page = () => {
  const params = useParams();
  const reportId = params.id as string;

  const { user, isLoading: userLoading } = useExtendedSession();

  // Fetch report details
  const { data: report, isLoading: reportLoading } =
    trpc.getReportById.useQuery({ reportId }, { enabled: !!reportId });

  const isLoading = userLoading || reportLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!report) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <Container size="lg" className="space-y-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Report not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The report you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Button asChild>
              <Link href="/watcher/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/watcher/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
                {report.title}
              </h1>
              <p className="text-muted-foreground">Report ID: {report.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-lg px-4 py-2 ${
                statusColors[report.status as keyof typeof statusColors]
              }`}
            >
              {report.status}
            </Badge>
            {report.status === "published" && (
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Report Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <Card className="lg:col-span-2 shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <FileText className="h-5 w-5" />
                Report Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Title
                </h3>
                <p className="text-lg font-medium">{report.title}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  File Information
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        File Key
                      </span>
                      <span className="text-sm font-mono">
                        {report.fileKey}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Status
                      </span>
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
                    </div>
                  </div>
                </div>
              </div>

              {report.status === "published" && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Actions
                  </h3>
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Sidebar */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <Clock className="h-5 w-5" />
                Report Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Author
                </h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {report.authorName || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Created Date
                </h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(
                      new Date(report.createdAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Last Updated
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(
                      new Date(report.updatedAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Publication Status
                </h3>
                <Badge
                  variant="outline"
                  className={
                    statusColors[report.status as keyof typeof statusColors]
                  }
                >
                  {report.status}
                </Badge>
              </div>

              {report.reportedById === user?.id && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Your Report
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You are the author of this report
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Publication History (placeholder for future implementation) */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-title text-lg">
              <FileText className="h-5 w-5" />
              Publication History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Report created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(report.createdAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </p>
                </div>
              </div>

              {report.status === "published" && (
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Report published</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(report.updatedAt),
                        "MMM dd, yyyy 'at' HH:mm"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default Page;
