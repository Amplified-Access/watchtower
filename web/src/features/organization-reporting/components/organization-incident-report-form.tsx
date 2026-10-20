"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import PlaceSearchCombobox from "@/components/common/place-search-combobox";
import {
  organizationIncidentFormSchema,
  type OrganizationIncidentFormData,
  emptyLocation,
  entityOptions,
  casualtyOptions,
  severityOptions,
} from "../schemas/organization-incident-form-schema";
import { trpc } from "@/_trpc/client";

interface OrganizationIncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const OrganizationIncidentReportForm: React.FC<
  OrganizationIncidentReportFormProps
> = ({ isOpen, onClose, onSuccess }) => {
  // Get organization's incident types
  const {
    data: incidentTypesData,
    isLoading: isLoadingTypes,
    error,
  } = trpc.getOrganizationIncidentTypes.useQuery();

  // Also get current user to debug auth state
  const { data: currentUser } = trpc.getCurrentUser.useQuery();

  // Initialize form using shadcn Form pattern
  const form = useForm<OrganizationIncidentFormData>({
    resolver: zodResolver(organizationIncidentFormSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      location: emptyLocation,
      entities: [],
      severity: "medium",
    },
  });

  // Submit mutation
  const submitReport =
    trpc.organizationReports.submitOrganizationIncidentReport.useMutation({
      onSuccess: () => {
        toast.success("Incident report submitted successfully!");
        form.reset();
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit incident report");
      },
    });

  // useWatch rather than form.watch(): watch() returns a value the React
  // Compiler cannot memoize, so it skips optimising this whole component.
  const selectedEntities = useWatch({ control: form.control, name: "entities" }) || [];
  // Only read by the development-only debug panel below.
  const debugValues = useWatch({ control: form.control });

  // Handle entity toggle
  const handleEntityToggle = (entityValue: string, checked: boolean) => {
    const currentEntities = selectedEntities || [];
    let newEntities: (typeof entityOptions)[number][];

    if (checked) {
      newEntities = [
        ...currentEntities,
        entityValue as (typeof entityOptions)[number],
      ];
    } else {
      newEntities = currentEntities.filter((entity) => entity !== entityValue);
    }

    form.setValue("entities", newEntities);
  };

  // Submit handler
  const onSubmit = (data: OrganizationIncidentFormData) => {
    console.log("🚀 Form submission data:", data);
    console.log("📍 Location data:", data.location);
    // The selects store counts as "0".."5" and "6+"; the mutation takes
    // numbers. Removing an `as any` here surfaced that the strings were being
    // sent through unconverted.
    const toCount = (value: string) => (value === "6+" ? 6 : Number(value));
    const submissionData = {
      ...data,
      injuries: toCount(data.injuries),
      fatalities: toCount(data.fatalities),
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
        country: data.location.country ?? undefined,
      },
    };
    submitReport.mutate(submissionData);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const incidentTypes = incidentTypesData || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Incident</DialogTitle>
          <DialogDescription>
            Submit a detailed incident report for your organization.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Incident Type */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingTypes ? (
                          <SelectItem value="" disabled>
                            Loading...
                          </SelectItem>
                        ) : incidentTypes.length === 0 ? (
                          <SelectItem value="" disabled>
                            No incident types available
                          </SelectItem>
                        ) : (
                          incidentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <PlaceSearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search for location..."
                      icon={<MapPin className="size-4 shrink-0 text-muted-foreground" />}
                      className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs aria-invalid:border-destructive"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide a detailed description of the incident..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Severity */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {severityOptions.map((severity) => (
                          <SelectItem key={severity} value={severity}>
                            {severity.charAt(0).toUpperCase() +
                              severity.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entities Involved */}
            <div className="space-y-3">
              <Label>Entities Involved *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entityOptions.map((entity) => (
                  <div key={entity} className="flex items-center space-x-2">
                    <Checkbox
                      id={entity}
                      checked={selectedEntities.includes(entity)}
                      onCheckedChange={(checked) =>
                        handleEntityToggle(entity, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={entity}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {entity
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.entities && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.entities.message}
                </p>
              )}
            </div>

            {/* Casualties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="injuries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Injuries</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatalities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Fatalities</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Debug Panel - Remove in production */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-gray-100 p-4 rounded-lg text-xs">
                <h4 className="font-bold mb-2">Debug Info:</h4>
                <div className="space-y-1">
                  <div>
                    Form Valid:{" "}
                    {Object.keys(form.formState.errors).length === 0
                      ? "✅"
                      : "❌"}
                  </div>
                  <div>
                    Form Errors:{" "}
                    {JSON.stringify(form.formState.errors, null, 2)}
                  </div>
                  <div>
                    Watch Values: {JSON.stringify(debugValues, null, 2)}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("🔍 Current form state:", form.getValues());
                    console.log("❌ Current errors:", form.formState.errors);
                  }}
                  className="mt-2 text-xs"
                  size="sm"
                >
                  Log Form State
                </Button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitReport.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitReport.isPending}
                className="flex-1"
              >
                {submitReport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationIncidentReportForm;
