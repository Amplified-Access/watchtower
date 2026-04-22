"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/common/container";
import Link from "next/link";

interface FormItem {
  id: string;
  name: string;
  definition: any;
  createdAt: Date;
  updatedAt: Date;
}

const WatcherFormsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();

  const {
    data: activeForms,
    isLoading: formsLoading,
    error: formsError,
    refetch,
  } = trpc.getActiveFormsForWatcher.useQuery(undefined, {
    enabled: !!user?.id,
  });

  if (userLoading || formsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (formsError) {
    toast.error("Failed to load forms");
    return (
      <div className="text-center text-red-500 py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading forms</h3>
        <p className="text-muted-foreground">
          Failed to load available forms. Please try again.
        </p>
        <Button onClick={() => refetch()} className="mt-4" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!user?.organizationId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">No Organization</h3>
        <p className="text-muted-foreground">
          You must be associated with an organization to view and submit forms.
        </p>
      </div>
    );
  }

  const forms = activeForms || [];

  const getFieldCount = (definition: any) => {
    if (!definition || typeof definition !== "object") {
      return 0;
    }
    return Object.keys(definition).length;
  };

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-title pt-4 pb-2">
            Available Forms
          </h1>
          <p className="text-muted-foreground">
            {forms.length} active form{forms.length !== 1 ? "s" : ""} available
            for reporting
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No active forms available
          </h3>
          <p className="text-muted-foreground">
            There are currently no active forms available for reporting. Please
            contact your administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="shadow-none rounded-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {form.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Created {new Date(form.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>
                      {getFieldCount(form.definition)} field
                      {getFieldCount(form.definition) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Last updated:{" "}
                      {new Date(form.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/watcher/forms/${form.id}/submit`}>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Submit Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2">
            <p>1. Click on "Submit Report" for the form you want to use</p>
            <p>2. Fill out all required fields in the form</p>
            <p>3. Review your information before submitting</p>
            <p>4. Your report will be sent to the administrators for review</p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WatcherFormsContent;
