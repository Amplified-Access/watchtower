"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Container from "@/components/common/container";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface FormSubmissionContentProps {
  formId: string;
}

const FormSubmissionContent = ({ formId }: FormSubmissionContentProps) => {
  const { user, isLoading: userLoading } = useExtendedSession();
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("FormSubmission");
  const tCommon = useTranslations("Common");

  const {
    data: form,
    isLoading: formLoading,
    error: formError,
  } = trpc.getFormById.useQuery({ formId }, { enabled: !!formId });

  const submitIncidentMutation = trpc.submitIncident.useMutation({
    onSuccess: (result) => {
      toast.success(t("submitSuccess"));
      router.push("/watcher/forms");
    },
    onError: (error) => {
      toast.error(error.message || t("submitError"));
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) {
      toast.error(t("formNotFound"));
      return;
    }

    // Validate required fields
    const definition = form.definition || {};
    const requiredFields = Object.entries(definition).filter(
      ([_, field]: [string, any]) =>
        field?.required === true || field?.required === "on",
    );

    for (const [fieldKey, field] of requiredFields as [string, any][]) {
      if (
        !formData[fieldKey] ||
        (typeof formData[fieldKey] === "string" &&
          formData[fieldKey].trim() === "")
      ) {
        toast.error(`${t("requiredFieldError")} ${field.title || fieldKey}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await submitIncidentMutation.mutateAsync({
        formId: form.id,
        data: formData,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const renderFormField = (fieldKey: string, field: any) => {
    const fieldValue = formData[fieldKey] || "";
    const isRequired = field.required === true || field.required === "on";
    const description = field.description || "";

    switch (field.type) {
      case "short-answer":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.title || fieldKey}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="text"
              value={fieldValue}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={
                description || `${t("enterPrefix")} ${field.title || fieldKey}`
              }
              required={isRequired}
              className="bg-white"
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        );

      case "paragraph":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.title || fieldKey}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldKey}
              value={fieldValue}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={
                description || `${t("enterPrefix")} ${field.title || fieldKey}`
              }
              rows={4}
              required={isRequired}
              className="bg-white h-40"
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        );

      case "multiple-choice":
        const radioOptions = field.options || [];
        return (
          <div key={fieldKey} className="space-y-2">
            <div className="flex flex-col gap-1 mb-3">
              <Label>
                {field.title || fieldKey}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {description && (
                <div className="text-muted-foreground text-sm">
                  {description}
                </div>
              )}
            </div>
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => handleInputChange(fieldKey, value)}
              required={isRequired}
            >
              {radioOptions.map((option: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 pb-1 hover:cursor-pointer"
                >
                  <RadioGroupItem
                    className="bg-white"
                    value={option}
                    id={`radio-${fieldKey}-${i}`}
                  />
                  <Label htmlFor={`radio-${fieldKey}-${i}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "drop-down":
        const dropdownOptions = field.options || [];
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.title || fieldKey}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {description && (
              <div className="text-muted-foreground text-sm mb-2">
                {description}
              </div>
            )}
            <Select
              value={fieldValue}
              onValueChange={(value) => handleInputChange(fieldKey, value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={description || t("selectOption")} />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.map((option: string, i: number) => (
                  <SelectItem key={i} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        // Fallback for unknown field types
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.title || fieldKey}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              value={fieldValue}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={
                description || `${t("enterPrefix")} ${field.title || fieldKey}`
              }
              required={isRequired}
              className="bg-white"
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        );
    }
  };

  if (userLoading || formLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="32" />
      </div>
    );
  }

  if (formError || !form) {
    return (
      <div className="text-center text-red-500 py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t("formNotFound")}</h3>
        <p className="text-muted-foreground">{t("formNotFoundMessage")}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/watcher/forms">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToForms")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">{t("formInactive")}</h3>
        <p className="text-muted-foreground">{t("formInactiveMessage")}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/watcher/forms">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToForms")}
          </Link>
        </Button>
      </div>
    );
  }

  const definition = form.definition || {};
  const fieldEntries = Object.entries(definition);

  return (
    <Container className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{form.name}</h1>
          <p className="text-muted-foreground">{t("submitNewReport")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("reportForm")}
            </CardTitle>
            <CardDescription>{t("requiredFieldsNotice")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fieldEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t("noFieldsDefined")}
              </p>
            ) : (
              fieldEntries.map(([fieldKey, field]) =>
                renderFormField(fieldKey, field),
              )
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || fieldEntries.length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader size="16" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("submitReport")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default FormSubmissionContent;
