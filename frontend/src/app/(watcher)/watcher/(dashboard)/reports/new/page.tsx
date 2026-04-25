"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ArrowLeft, Upload, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const Page = () => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useExtendedSession();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get organization data
  const { data: organizationData, isLoading: orgLoading } =
    trpc.getAdminOrganization.useQuery(
      { userId: user?.id || "" },
      { enabled: !!user?.id }
    );

  const createReportMutation = trpc.createReport.useMutation({
    onSuccess: () => {
      toast.success("Report created successfully!");
      router.push("/watcher/reports");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create report");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a report title");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, we'll use a placeholder file key
      // In a real implementation, you would upload the file to R2 first
      const fileKey = `reports/${Date.now()}-${file.name}`;

      createReportMutation.mutate({
        title: title.trim(),
        fileKey,
        status,
      });
    } catch (error) {
      toast.error("Failed to create report");
      setIsSubmitting(false);
    }
  };

  const isLoading = userLoading || orgLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/watcher/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
              Create New Report
            </h1>
            <p className="text-muted-foreground">
              Upload and publish a new report for your organization
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <FileText className="h-5 w-5" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter report title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Report File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                      }
                    }}
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        {file ? file.name : "Choose a file to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, TXT
                      </p>
                      {file && (
                        <p className="text-sm text-green-600">
                          File selected: {(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Publication Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: "draft" | "published") =>
                    setStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      Draft (Save for later)
                    </SelectItem>
                    <SelectItem value="published">
                      Publish immediately
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {status === "draft"
                    ? "Save as draft to continue editing later"
                    : "Publish immediately to make it available to your organization"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                <AlertCircle className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Organization:</span>{" "}
                  {organizationData?.organizationId || "Your Organization"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This report will be associated with your organization and will
                  be visible to other members.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/watcher/reports")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !file}
            >
              {isSubmitting ? (
                <Loader />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {status === "draft" ? "Save Draft" : "Publish Report"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
};

export default Page;
