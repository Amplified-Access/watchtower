"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";

const statusColors = {
  reported: "border-red-200 text-red-700 bg-red-50",
  investigating: "border-yellow-200 text-yellow-700 bg-yellow-50",
  resolved: "border-green-200 text-green-700 bg-green-50",
  closed: "border-gray-200 text-gray-700 bg-gray-50",
};

const Page = () => {
  const params = useParams();
  const incidentId = params.id as string;

  const { user, isLoading: userLoading } = useExtendedSession();

  // Fetch incident details
  const { data: incident, isLoading: incidentLoading } =
    trpc.getIncidentById.useQuery({ incidentId }, { enabled: !!incidentId });

  const isLoading = userLoading || incidentLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!incident) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <Container size="lg" className="space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Incident not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The incident you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Button asChild>
              <Link href="/watcher/incidents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Incidents
              </Link>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Check if the current user is the reporter
  const isMyIncident = incident.reportedByUserId === user?.id;

  if (!isMyIncident) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <Container size="lg" className="space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Access denied
            </h3>
            <p className="text-muted-foreground mb-4">
              You can only view incidents that you have reported.
            </p>
            <Button asChild>
              <Link href="/watcher/incidents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Incidents
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
              <Link href="/watcher/incidents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Incidents
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
                Incident Details
              </h1>
              <p className="text-muted-foreground">
                Incident ID: {incident.id}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-lg px-4 py-2 ${
              statusColors[incident.status as keyof typeof statusColors]
            }`}
          >
            {incident.status}
          </Badge>
        </div>

        {/* Incident Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <Card className="lg:col-span-2 shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <FileText className="h-5 w-5" />
                Incident Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Form Used
                </h3>
                <p className="text-lg font-medium">
                  {incident.formName || "Unknown Form"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Reported Data
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {incident.data && typeof incident.data === "object" ? (
                    <div className="space-y-3">
                      {Object.entries(incident.data).map(([key, value]) => (
                        <div
                          key={key}
                          className="border-b border-muted pb-2 last:border-b-0"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground capitalize">
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </span>
                            <span className="text-sm">
                              {typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No additional data available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Sidebar */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Reporter
                </h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {incident.reporterEmail || "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Reported Date
                </h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(
                      new Date(incident.createdAt),
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
                      new Date(incident.updatedAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Status
                </h3>
                <Badge
                  variant="outline"
                  className={
                    statusColors[incident.status as keyof typeof statusColors]
                  }
                >
                  {incident.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status History (placeholder for future implementation) */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-title text-lg">
              <AlertTriangle className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Incident reported</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(incident.createdAt),
                      "MMM dd, yyyy 'at' HH:mm"
                    )}
                  </p>
                </div>
              </div>

              {incident.status !== "reported" && (
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Status updated to {incident.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(incident.updatedAt),
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
