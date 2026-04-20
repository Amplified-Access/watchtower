"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Loader from "@/components/common/loader";
import AddField from "./add-field";
import FormPreview from "./form-preview";
import Link from "next/link";

interface FormBuilderProps {
  formId?: string;
}

const FormBuilder = ({ formId }: FormBuilderProps) => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useExtendedSession();
  const [questions, setQuestions] = useState({});
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing form if editing
  const {
    data: existingForm,
    isLoading: formLoading,
    error: formError,
  } = trpc.getFormById.useQuery(
    { formId: formId || "" },
    { enabled: !!formId }
  );

  // Load existing form data
  useEffect(() => {
    if (existingForm) {
      setFormTitle(existingForm.name);
      setQuestions(existingForm.definition || {});
      setIsActive(existingForm.isActive ?? true);
    }
  }, [existingForm]);

  const saveFormMutation = trpc.saveFormDefinition.useMutation();
  const updateFormMutation = trpc.updateForm.useMutation();

  const handleSaveForm = async () => {
    if (!user?.organizationId) {
      toast.error("You must be associated with an organization");
      return;
    }

    setIsSaving(true);
    try {
      if (formId && existingForm) {
        // Update existing form
        const result = await updateFormMutation.mutateAsync({
          formId,
          title: formTitle,
          definition: questions,
          isActive,
        });

        if (result.success) {
          toast.success("Form updated successfully");
        } else {
          toast.error("Failed to update form");
        }
      } else {
        // Create new form
        const result = await saveFormMutation.mutateAsync({
          title: formTitle,
          definition: questions,
          organizationId: user.organizationId,
        });

        if (result.success) {
          toast.success("Form created successfully");
          router.push("/admin/forms");
        } else {
          toast.error("Failed to create form");
        }
      }
    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || (formId && formLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="32" />
      </div>
    );
  }

  if (formError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          <p>Error loading form. Please try again.</p>
          <Link href="/admin/forms">
            <Button className="mt-4">Back to Forms</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user?.organizationId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            You must be associated with an organization to create forms.
          </p>
          <Link href="/admin/forms">
            <Button>Back to Forms</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Questions Panel */}
      <div className="bg-muted/50 w-80 border-r flex flex-col">
        <div className="px-4 py-2 border-b bg-sidebar">
          <div className="flex items-center justify-center gap-1">
            <h2 className="font-semibold">Questions</h2>
            <p className=" text-muted-foreground">
              ({Object.keys(questions).length})
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.keys(questions).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No questions yet</p>
              <p className="text-xs mt-1">
                Click the + button below to add your first question
              </p>
            </div>
          ) : (
            Object.values(questions).map((question: any, index) => (
              <div
                key={index}
                className="bg-background rounded-md p-3 shadow-sm border hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-sm line-clamp-2">
                  {question.title || "Untitled Question"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {question.type || "Text"} {question.required && "• Required"}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <AddField questions={questions} setQuestions={setQuestions} />
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <FormPreview
          questions={questions}
          title={formTitle}
          setTitle={setFormTitle}
          className="flex-1"
          formId={formId}
          handleSaveForm={handleSaveForm}
          isSaving={isSaving}
        />
      </div>

      {/* Settings Panel */}
      <div className="bg-muted/50 w-80 border-l flex flex-col">
        <div className="px-4 py-2 border-b bg-sidebar">
          <h2 className="font-semibold text-center">Settings</h2>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Form Status</label>
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {isActive
                  ? "Form is available for submissions"
                  : "Form is hidden from users"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
