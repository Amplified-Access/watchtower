"use client";

import React from "react";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MapPin, X, Send } from "lucide-react";
import {
  organizationIncidentFormSchema,
  type OrganizationIncidentFormData,
  emptyLocation,
  entityOptions,
  casualtyOptions,
  severityOptions,
} from "../schemas/organization-incident-form-schema";
import { trpc } from "@/_trpc/client";
import PlaceSearchCombobox from "@/components/common/place-search-combobox";

interface StandaloneOrganizationIncidentFormProps {
  onSuccess?: () => void;
}

const StandaloneOrganizationIncidentForm: React.FC<
  StandaloneOrganizationIncidentFormProps
> = ({ onSuccess }) => {
  // Get organization's incident types
  const { data: incidentTypesData, isLoading: isLoadingTypes } =
    trpc.getOrganizationIncidentTypes.useQuery();

  // Submit mutation
  const submitReport =
    trpc.organizationReports.submitOrganizationIncidentReport.useMutation({
      onSuccess: () => {
        toast.success("Incident report submitted successfully!");
        reset();
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit incident report");
      },
    });

  const form = useForm<OrganizationIncidentFormData>({
    resolver: zodResolver(organizationIncidentFormSchema),
    defaultValues: {
      location: emptyLocation,
      entities: [],
      severity: "medium",
    },
  });
  const { setValue, reset, trigger } = form;

  // useWatch rather than form.watch(): watch() returns a value the React
  // Compiler cannot memoize, so it skips optimising this whole component.
  const selectedEntities = useWatch({ control: form.control, name: "entities" }) || [];

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

    setValue("entities", newEntities);
    trigger("entities");
  };

  // Submit handler
  const onSubmit = (data: OrganizationIncidentFormData) => {
    // console.log("Executing......");
    // Counts come from the selects as "0".."5" and "6+"; the mutation takes
    // numbers.
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

  const incidentTypes = incidentTypesData || [];

  return (
    <Card className="shadow-none rounded-md">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Incident Type */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Search */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <PlaceSearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search for a location..."
                      icon={<MapPin className="size-4 shrink-0 text-gray-400" />}
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide a detailed description of the incident..."
                      className="min-h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entities Involved */}
            <FormField
              control={form.control}
              name="entities"
              render={() => (
                <FormItem>
                  <FormLabel>Entities Involved</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {entityOptions.map((entity) => (
                      <FormField
                        key={entity}
                        control={form.control}
                        name="entities"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                id={entity}
                                checked={field.value?.includes(entity)}
                                onCheckedChange={(checked) => {
                                  const currentEntities = field.value || [];
                                  let newEntities;
                                  if (checked) {
                                    newEntities = [...currentEntities, entity];
                                  } else {
                                    newEntities = currentEntities.filter(
                                      (e) => e !== entity
                                    );
                                  }
                                  field.onChange(newEntities);
                                }}
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={entity}
                              className="text-sm font-normal"
                            >
                              {entity
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of injuries" />
                        </SelectTrigger>
                        <SelectContent>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "6+" ? "More than 5" : option}
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
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of fatalities" />
                        </SelectTrigger>
                        <SelectContent>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "6+" ? "More than 5" : option}
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

            {/* Severity */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Severity</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {severityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="submit"
                // disabled={submitReport.isPending}
                className="min-w-32"
              >
                {submitReport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StandaloneOrganizationIncidentForm;
