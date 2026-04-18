"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Container from "@/components/common/container";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SuperAdminIncidentDetailContentProps {
  incidentId: string;
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

const SuperAdminIncidentDetailContent = ({
  incidentId,
}: SuperAdminIncidentDetailContentProps) => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const router = useRouter();

  // Fetch incident details
  const {
    data: incident,
    isLoading: incidentLoading,
    error: incidentError,
    refetch,
  } = trpc.getIncidentByIdForSuperAdmin.useQuery({ incidentId });

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
      router.push("/superadmin/incidents");
    },
    onError: (error) => {
      toast.error("Failed to delete incident");
    },
  });

  const handleStatusUpdate = async (
    newStatus: "reported" | "investigating" | "resolved" | "closed"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ incidentId, status: newStatus });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeleteIncident = async () => {
    try {
      await deleteIncidentMutation.mutateAsync({ incidentId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (userLoading || incidentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (incidentError) {
    toast.error("Failed to load incident");
    return (
      <div className="text-center text-red-500 py-8">
        Error loading incident. Please try again.
      </div>
    );
  }

  if (user?.role !== "super-admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be a super admin to view incident details.
        </p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Incident not found.</p>
      </div>
    );
  }

  const renderFieldValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || "No response");
  };

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/superadmin/incidents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Incidents
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Incident Details</h1>
            <p className="text-muted-foreground">Incident ID: {incident.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("investigating")}
                disabled={incident.status === "investigating"}
              >
                Mark as Investigating
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("resolved")}
                disabled={incident.status === "resolved"}
              >
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("closed")}
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
                      This action cannot be undone. This will permanently delete
                      the incident and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteIncident}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status and Organization Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Status</p>
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

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Organization</p>
              <p className="text-sm text-muted-foreground">
                {incident.organizationName || "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Reporter</p>
              <p className="text-sm text-muted-foreground">
                {incident.reporterEmail || "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(incident.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Information */}
      <Card>
        <CardHeader>
          <CardTitle>Form Information</CardTitle>
          <CardDescription>
            Details about the form used to submit this incident
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Form Name: </span>
              <span>{incident.formName || "Unknown Form"}</span>
            </div>
            <div>
              <span className="font-medium">Last Updated: </span>
              <span>{new Date(incident.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident Data */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Data</CardTitle>
          <CardDescription>
            Information submitted by the reporter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incident.data && typeof incident.data === "object" ? (
            <div className="space-y-4">
              {Object.entries(incident.data).map(([key, value]) => (
                <div key={key} className="border-b pb-3 last:border-b-0">
                  <div className="font-medium text-sm mb-1 capitalize">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {renderFieldValue(key, value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default SuperAdminIncidentDetailContent;
