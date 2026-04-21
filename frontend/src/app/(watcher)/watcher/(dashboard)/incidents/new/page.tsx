"use client";

import React from "react";
import Container from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StandaloneOrganizationIncidentForm from "@/features/organization-reporting/components/standalone-organization-incident-form";

const WatcherIncidentReportPage = () => {
  const router = useRouter();

  const handleFormSuccess = () => {
    // Redirect to incidents list after successful submission
    router.push("/watcher/incidents");
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
              Report New Incident
            </h1>
            <p className="text-muted-foreground">
              Report an incident on behalf of your organization
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/watcher/incidents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incidents
            </Link>
          </Button>
        </div>

        {/* Instructions */}
        {/* <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-title text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Organization Incident Report
            </CardTitle>
          </CardHeader>
          {/* <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This report will be associated with your organization and will
                be visible to organization administrators.
              </p>
              <p>
                Please provide accurate and detailed information about the
                incident. This information may be used for verification and
                follow-up purposes.
              </p>
            </div>
          </CardContent>
        </Card> */}

        {/* Report Form */}
        <StandaloneOrganizationIncidentForm onSuccess={handleFormSuccess} />
      </Container>
    </div>
  );
};

export default WatcherIncidentReportPage;
