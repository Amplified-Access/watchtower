"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormPreviewPageProps {
  formId: string;
}

const FormPreviewPage = ({ formId }: FormPreviewPageProps) => {
  const { user, isLoading: userLoading } = useExtendedSession();

  const {
    data: form,
    isLoading: formLoading,
    error: formError,
  } = trpc.getFormById.useQuery({ formId }, { enabled: !!formId });

  if (userLoading || formLoading) {
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

  if (!form) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Form not found.</p>
          <Link href="/admin/forms">
            <Button>Back to Forms</Button>
          </Link>
        </div>
      </div>
    );
  }

  const questions = form.definition || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <Link href="/admin/forms">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">{form.name}</h1>
              <p className="text-sm text-muted-foreground">Form Preview</p>
            </div>
          </div>
          <Link href={`/admin/forms/${formId}`}>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Form
            </Button>
          </Link>
        </div>
      </div>

      {/* Form Preview */}
      <div className="container mx-auto py-8 px-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{form.name}</CardTitle>
            <CardDescription>
              {form.isActive ? (
                <span className="text-green-600">
                  This form is currently active
                </span>
              ) : (
                <span className="text-red-600">
                  This form is currently inactive
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {Object.keys(questions).length > 0 ? (
                Object.values(questions).map((question: any, index) => (
                  <FormField key={index} question={question} />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>This form doesn't have any questions yet.</p>
                  <Link href={`/admin/forms/${formId}`}>
                    <Button className="mt-4">Add Questions</Button>
                  </Link>
                </div>
              )}
              {Object.keys(questions).length > 0 && (
                <Button type="button" className="w-full" disabled>
                  Submit Form (Preview Mode)
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Component to render individual form fields
const FormField = ({ question }: { question: any }) => {
  const { type, title, description, options, required } = question;
  const isRequired = required === true || required === "on";

  switch (type) {
    case "short-answer":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {title} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={description || `Enter ${title}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          />
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      );

    case "paragraph":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {title} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={4}
            placeholder={description || `Enter ${title}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            disabled
          />
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      );

    case "multiple-choice":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {title} {isRequired && <span className="text-red-500">*</span>}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          <div className="space-y-2">
            {options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${title}`}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled
                />
                <label className="ml-2 text-sm text-gray-700">{option}</label>
              </div>
            ))}
          </div>
        </div>
      );

    case "drop-down":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {title} {isRequired && <span className="text-red-500">*</span>}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Select an option</option>
            {options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-medium mb-2">
            {title} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={description || `Enter ${title}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          />
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      );
  }
};

export default FormPreviewPage;
