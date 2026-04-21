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
  FileText,
  MoreHorizontal,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/common/container";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface IncidentDetailContentProps {
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

const IncidentDetailContent = ({ incidentId }: IncidentDetailContentProps) => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const router = useRouter();

  const {
    data: incident,
    isLoading: incidentLoading,
    error: incidentError,
    refetch,
  } = trpc.getIncidentById.useQuery({ incidentId }, { enabled: !!incidentId });

  const updateStatusMutation = trpc.updateIncidentStatus.useMutation({
    onSuccess: () => {
      toast.success("Incident status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update incident status");
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

  if (userLoading || incidentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (incidentError || !incident) {
    toast.error("Incident not found");
    return (
      <div className="text-center text-red-500 py-8">
        Incident not found. Please check the ID and try again.
      </div>
    );
  }

  const renderFormData = (data: any) => {
    if (!data || typeof data !== "object") {
      return <p className="text-muted-foreground">No data submitted</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border-l-2 border-blue-200 pl-4">
            <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </p>
            <p className="mt-1">
              {Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value) || "No value provided"}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Incident Details</h1>
            <p className="text-muted-foreground font-mono text-sm">
              ID: {incident.id}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Actions
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
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("reported")}
              disabled={incident.status === "reported"}
            >
              Reopen Incident
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Incident Overview</CardTitle>
              <Badge
                variant="outline"
                className={
                  statusColors[incident.status as keyof typeof statusColors]
                }
              >
                {incident.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Form</p>
                  <p className="font-medium">
                    {incident.formName || "Unknown Form"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reporter</p>
                  <p className="font-medium">
                    {incident.reporterEmail || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reported</p>
                  <p className="font-medium">
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {incident.updatedAt !== incident.createdAt && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(incident.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Submitted Data</CardTitle>
            <CardDescription>
              Information submitted through the form
            </CardDescription>
          </CardHeader>
          <CardContent>{renderFormData(incident.data)}</CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default IncidentDetailContent;
