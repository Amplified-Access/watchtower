"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  entityOptions,
  casualtyOptions,
  severityOptions,
} from "../schemas/organization-incident-form-schema";
import { trpc } from "@/_trpc/client";

interface StandaloneOrganizationIncidentFormProps {
  onSuccess?: () => void;
}

const StandaloneOrganizationIncidentForm: React.FC<
  StandaloneOrganizationIncidentFormProps
> = ({ onSuccess }) => {
  const [locationSearch, setLocationSearch] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

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

  // Location search
  const searchLocation = trpc.anonymousReports.searchLocation.useQuery(
    { searchTerm: locationSearch },
    {
      enabled: locationSearch.length > 2,
    }
  );

  // Handle location search results
  useEffect(() => {
    if (searchLocation.data?.success) {
      setLocations(searchLocation.data.data);
      setIsSearchingLocation(false);
    } else if (searchLocation.error) {
      setIsSearchingLocation(false);
      setLocations([]);
    }
  }, [searchLocation.data, searchLocation.error]);

  const form = useForm<OrganizationIncidentFormData>({
    resolver: zodResolver(organizationIncidentFormSchema as any),
    defaultValues: {
      entities: [],
      severity: "medium",
    },
  });
  const { watch, setValue, reset, trigger } = form;

  const selectedEntities = watch("entities") || [];

  // Handle location search with debouncing
  const handleLocationSearch = useCallback((value: string) => {
    setLocationSearch(value);
    if (value.length > 2) {
      setIsSearchingLocation(true);
    } else {
      setLocations([]);
      setIsSearchingLocation(false);
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    // Map the selected location to the expected schema
    setValue("location", {
      lat:
        typeof location.lat === "string"
          ? parseFloat(location.lat)
          : location.lat,
      lon:
        typeof location.lon === "string"
          ? parseFloat(location.lon)
          : location.lon,
      admin1: location.admin1 || location.state || location.region || "",
      region: location.region || location.state || location.admin1 || "",
      country:
        location.country ||
        location.display_name?.split(",").pop()?.trim() ||
        "",
    });
    setLocationSearch(location.display_name);
    setLocations([]);
    trigger("location");
  };

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
    submitReport.mutate(data);
  };

  const incidentTypes = incidentTypesData?.data || [];

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
              render={() => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search for a location..."
                        value={locationSearch}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        className="pr-10"
                      />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </FormControl>
                  {/* Location Results */}
                  {isSearchingLocation && (
                    <div className="text-sm text-gray-500">Searching...</div>
                  )}
                  {locations.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {locations.map((location, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <div className="text-sm">{location.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedLocation && (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Selected: {selectedLocation.display_name}
                    </div>
                  )}
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
