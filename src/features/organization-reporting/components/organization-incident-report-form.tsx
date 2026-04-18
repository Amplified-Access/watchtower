"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, MapPin, X } from "lucide-react";
import {
  organizationIncidentFormSchema,
  type OrganizationIncidentFormData,
  type OrganizationLocationData,
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
  const [locationSearch, setLocationSearch] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Transform LocationIQ API response to our simplified format
  const transformLocationData = (
    locationIQResponse: any,
  ): OrganizationLocationData => {
    // Parse the display_name to extract region and admin1
    const displayName = locationIQResponse.display_name || "";
    const parts = displayName.split(", ");

    // Try to extract country, region, and admin1 from the display_name
    // Format is usually: "City, Admin1, Country" or "Admin1, Country"
    const country = parts[parts.length - 1] || "";
    const admin1 = parts.length > 1 ? parts[parts.length - 2] : "";

    // For region, we'll use a mapping based on country or a default
    const getRegionForCountry = (country: string): string => {
      const regionMap: Record<string, string> = {
        Kenya: "Eastern Africa",
        Ethiopia: "Eastern Africa",
        Uganda: "Eastern Africa",
        Tanzania: "Eastern Africa",
        Sudan: "Eastern Africa",
        Eritrea: "Eastern Africa",
        Djibouti: "Eastern Africa",
        Rwanda: "Eastern Africa",
      };
      return regionMap[country] || "Unknown Region";
    };

    return {
      lat: parseFloat(locationIQResponse.lat) || 0,
      lon: parseFloat(locationIQResponse.lon) || 0,
      admin1: admin1 || "Unknown",
      region: getRegionForCountry(country),
      country: country || "Unknown",
    };
  };

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
    resolver: zodResolver(organizationIncidentFormSchema as any),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
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
        setSelectedLocation(null);
        setLocationSearch("");
        onSuccess?.();
        onClose();
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
    },
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

  const selectedEntities = form.watch("entities") || [];

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
    // Transform the LocationIQ response to our simplified format
    const transformedLocation = transformLocationData(location);
    form.setValue("location", transformedLocation);
    setLocationSearch(location.display_name);
    setLocations([]);
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

    form.setValue("entities", newEntities);
  };

  // Submit handler
  const onSubmit = (data: OrganizationIncidentFormData) => {
    console.log("🚀 Form submission data:", data);
    console.log("📍 Location data:", data.location);
    submitReport.mutate(data);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSelectedLocation(null);
      setLocationSearch("");
      setLocations([]);
    }
  }, [isOpen, form]);

  const incidentTypes = incidentTypesData?.data || [];

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
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for location..."
                  value={locationSearch}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  className="pl-10"
                />
                {isSearchingLocation && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Location suggestions */}
              {locations.length > 0 && (
                <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto">
                  {locations.map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="font-medium">{location.display_name}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLocation && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 flex-1">
                    {selectedLocation.display_name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLocation(null);
                      setLocationSearch("");
                      form.setValue("location", undefined as any);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {form.formState.errors.location && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>

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
                  <div>Selected Location: {selectedLocation ? "✅" : "❌"}</div>
                  <div>
                    Form Errors:{" "}
                    {JSON.stringify(form.formState.errors, null, 2)}
                  </div>
                  <div>
                    Watch Values: {JSON.stringify(form.watch(), null, 2)}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("🔍 Current form state:", form.watch());
                    console.log("❌ Current errors:", form.formState.errors);
                    console.log("📍 Selected location:", selectedLocation);
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
