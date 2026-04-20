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
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  FileText,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

const statusColors = {
  reported: "border-red-200 text-red-700 bg-red-50",
  investigating: "border-yellow-200 text-yellow-700 bg-yellow-50",
  resolved: "border-green-200 text-green-700 bg-green-50",
  closed: "border-gray-200 text-gray-700 bg-gray-50",
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

  // Fetch old incidents for the watcher's organization
  const { data: incidentsData, isLoading: incidentsLoading } =
    trpc.getAllOrganizationIncidents.useQuery(
      {
        organizationId: organizationId || "",
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: !!organizationId }
    );

  // Fetch new organization incident reports for the user
  const { data: orgIncidentReports, isLoading: orgIncidentReportsLoading } =
    trpc.organizationReports.getUserOrganizationIncidentReports.useQuery(
      {
        search: search || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: !!user?.id && !!organizationId }
    );

  // Filter old incidents to only show those reported by the current watcher
  const myOldIncidents =
    incidentsData?.incidents?.filter(
      (incident) => incident.reportedByUserId === user?.id
    ) || [];

  // Get organization incident reports (these are already filtered by user in the query)
  const myOrgIncidentReports = orgIncidentReports?.reports || [];

  // Transform organization incident reports to match the old incident format for display
  const transformedOrgReports = myOrgIncidentReports.map((report: any) => ({
    id: report.id,
    formName: `${report.incidentTypeName} Incident Report`,
    status: report.verified ? "resolved" : "reported", // Simple status mapping
    data: {
      location: report.location,
      description: report.description,
      entities: report.entities,
      injuries: report.injuries,
      fatalities: report.fatalities,
      severity: report.severity,
    },
    reportedByUserId: report.reportedByUserId,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }));

  // Combine both old incidents and new organization reports
  const allMyIncidents = [...myOldIncidents, ...transformedOrgReports];

  // Apply filters to the combined incidents
  const filteredIncidents = allMyIncidents.filter((incident) => {
    // Status filter
    if (statusFilter !== "all" && incident.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const incidentData = incident.data as any; // Type assertion for mixed data types
      const searchableText = [
        incident.formName || "",
        incidentData?.description || "",
        incidentData?.location?.admin1 || "",
        incidentData?.location?.country || "",
        incidentData?.location?.display_name || "",
      ].join(" ").toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const isLoading = userLoading || orgLoading || incidentsLoading || orgIncidentReportsLoading;

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
              My Incidents
            </h1>
            <p className="text-muted-foreground">
              View and track incidents you've reported
            </p>
          </div>
          <Button asChild>
            <Link href="/watcher/incidents/new">
              <Plus className="mr-2 h-4 w-4" />
              Report New Incident
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reported
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMyIncidents.length}</div>
              <p className="text-xs text-muted-foreground">
                Incidents you've reported
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Under Investigation
              </CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allMyIncidents.filter((i) => i.status === "investigating").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently being investigated
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allMyIncidents.filter((i) => i.status === "resolved").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully resolved
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none rounded-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allMyIncidents.filter((i) => i.status === "reported").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-title text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search incidents..."
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
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="font-title text-lg">My Incidents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredIncidents.length} incident(s)
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No incidents found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't reported any incidents yet"}
                </p>
                <Button asChild>
                  <Link href="/watcher/incidents/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Report Your First Incident
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono text-xs">
                        {incident.id.slice(0, 8)}...
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(
                              new Date(incident.createdAt),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(incident.updatedAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/watcher/incidents/${incident.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
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
