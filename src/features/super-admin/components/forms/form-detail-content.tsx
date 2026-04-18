"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  MoreHorizontal,
  Trash2,
  Power,
  PowerOff,
  Eye,
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

interface SuperAdminFormDetailContentProps {
  formId: string;
}

const SuperAdminFormDetailContent = ({
  formId,
}: SuperAdminFormDetailContentProps) => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const router = useRouter();

  // Fetch form details
  const {
    data: form,
    isLoading: formLoading,
    error: formError,
    refetch,
  } = trpc.getFormByIdForSuperAdmin.useQuery({ formId });

  const updateFormMutation = trpc.updateFormForSuperAdmin.useMutation({
    onSuccess: () => {
      toast.success("Form updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update form");
    },
  });

  const deleteFormMutation = trpc.deleteFormForSuperAdmin.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully");
      router.push("/superadmin/forms");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete form");
    },
  });

  const handleToggleStatus = async () => {
    if (!form) return;
    try {
      await updateFormMutation.mutateAsync({
        formId,
        isActive: !form.isActive,
      });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeleteForm = async () => {
    try {
      await deleteFormMutation.mutateAsync({ formId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const renderFormField = (field: any, index: number) => {
    const fieldTypeLabels: Record<string, string> = {
      "short-answer": "Short Answer",
      paragraph: "Paragraph",
      "multiple-choice": "Multiple Choice",
      "drop-down": "Dropdown",
    };

    return (
      <div key={index} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{field.label || `Field ${index + 1}`}</h4>
          <Badge variant="outline">
            {fieldTypeLabels[field.type] || field.type}
          </Badge>
        </div>

        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}

        {field.required && (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        )}

        {field.options && field.options.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Options:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {field.options.map((option: string, optIndex: number) => (
                <li key={optIndex}>{option}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (userLoading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (formError) {
    toast.error("Failed to load form");
    return (
      <div className="text-center text-red-500 py-8">
        Error loading form. Please try again.
      </div>
    );
  }

  if (user?.role !== "super-admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be a super admin to view form details.
        </p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Form not found.</p>
      </div>
    );
  }

  const formFields = (form.definition as any)?.fields || [];

  return (
    <Container className="space-y-6" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/superadmin/forms">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{form.name}</h1>
            <p className="text-muted-foreground">Form ID: {form.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            disabled={updateFormMutation.isPending}
          >
            {form.isActive ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/superadmin/incidents?formId=${form.id}`}
                  className="flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Incidents
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Form
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the form "{form.name}" and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteForm}
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
                  form.isActive
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {form.isActive ? "Active" : "Inactive"}
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
                {form.organizationName || "Unknown"}
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
                {new Date(form.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {new Date(form.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
          <CardDescription>Title and description of the form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Form Title</label>
              <p className="text-sm text-muted-foreground mt-1">
                {(form.definition as any)?.title || form.name || "No title"}
              </p>
            </div>
            {(form.definition as any)?.description && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {(form.definition as any).description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Form Fields ({formFields.length})</CardTitle>
          <CardDescription>Fields configured for this form</CardDescription>
        </CardHeader>
        <CardContent>
          {formFields.length > 0 ? (
            <div className="space-y-4">
              {formFields.map((field: any, index: number) =>
                renderFormField(field, index)
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No fields configured</p>
          )}
        </CardContent>
      </Card>

      {/* Raw Form Definition */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Form Definition</CardTitle>
          <CardDescription>
            Technical JSON structure of the form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(form.definition, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SuperAdminFormDetailContent;
