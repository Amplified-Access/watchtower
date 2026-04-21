"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  EllipsisVertical,
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
import { useState } from "react";
import Container from "@/components/common/container";

interface Form {
  id: string;
  name: string;
  definition: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  incidentCount: number;
}

const FormsContent = () => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError,
    refetch,
  } = trpc.getAllOrganizationFormsByOrganizationId.useQuery(
    { organizationId: user?.organizationId || "" },
    { enabled: !!user?.organizationId }
  );

  const deleteFormMutation = trpc.deleteForm.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully");
      refetch();
      setDeletingFormId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete form");
      setDeletingFormId(null);
    },
  });

  const handleDeleteForm = async (formId: string) => {
    setDeletingFormId(formId);
    try {
      await deleteFormMutation.mutateAsync({ formId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
        Error loading forms. Please try again.
      </div>
    );
  }

  if (!user?.organizationId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You must be associated with an organization to manage forms.
        </p>
      </div>
    );
  }

  return (
    <Container className="space-y-20" size="sm">
      {/* Header */}

      {/* Forms Grid */}
      <div>
        <h1 className="text-2xl pb-6 font-bold font-title">Forms</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New Form Card */}
          <Link href="/admin/forms/new">
            <Card className="border-dashed rounded-md border-2 hover:border-primary/50 transition-colors cursor-pointer group shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-muted-foreground group-hover:text-primary transition-colors mt-2">
                  Create New Form
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <h1 className="text-2xl font-bold pb-6 font-title">Existing Forms</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Existing Forms */}
          {forms?.map((form: Form) => (
            <Card key={form.id} className="shadow-none relative ">
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <div className="text-sm">
                    {form.isActive ? (
                      <span className="text-green-600 bg-green-600/10 px-2 rounded-full py-1">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 bg-red-600/10  px-2 rounded-full py-1">
                        Inactive
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="-translate-y-2 translate-x-3"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/forms/${form.id}/preview`}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/forms/${form.id}`}
                          className="flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
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
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Form</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{form.name}"?
                              This action cannot be undone and will also delete
                              all associated incident reports.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteForm(form.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingFormId === form.id ? (
                                <Loader size="16" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl line-clamp-1">
                      {form.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1 flex justify-between">
                  <p>{new Date(form.createdAt).toLocaleDateString()}</p>{" "}
                  <p className="">
                    {form.incidentCount} Incident
                    {form.incidentCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {forms && forms.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No forms yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first form to get started
          </p>
          <Link href="/admin/forms/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Form
            </Button>
          </Link>
        </div>
      )}
    </Container>
  );
};

export default FormsContent;
