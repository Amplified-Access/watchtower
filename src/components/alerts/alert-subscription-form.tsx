"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FaRegCircleQuestion } from "react-icons/fa6";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { MapPin, Bell, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import TextComponent from "../common/text-component";
import { useTranslations } from "next-intl";

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
] as const;

const ALERT_FREQUENCIES = [
  {
    value: "immediate",
    label: "Immediate",
    description: "Receive alerts immediately",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Receive monthly summaries",
  },
  {
    value: "quarterly",
    label: "Quarterly",
    description: "Receive quarterly summaries",
  },
  {
    value: "yearly",
    label: "Yearly",
    description: "Receive yearly summaries",
  },
] as const;

interface SelectedLocation {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
}

// Simplified schema based on user requirements
const alertSubscriptionFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  incidentTypes: z
    .array(z.string())
    .min(1, "At least one incident type is required"),
  location: z.string().min(1, "Location is required"),
  radius: z
    .number()
    .min(1, "Radius must be at least 1 km")
    .max(100, "Radius cannot exceed 100 km"),
  severityLevel: z
    .number()
    .min(0, "Please select a severity level")
    .max(3, "Invalid severity level"),
  alertFrequency: z.enum(["immediate", "hourly", "daily", "weekly"]),
  emailNotifications: z.boolean(),
  preferredLanguage: z.string(),
  timezone: z.string(),
});

type AlertSubscriptionFormData = z.infer<typeof alertSubscriptionFormSchema>;

const AlertSubscriptionForm: React.FC = () => {
  const t = useTranslations("Alerts");

  // State for location search and selection
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locations, setLocations] = useState<SelectedLocation[]>([]);
  const [isIncidentTypesOpen, setIsIncidentTypesOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>(null);

  // Get incident types from database
  const {
    data: incidentTypesData,
    isLoading: isLoadingTypes,
    error,
  } = trpc.anonymousReports.getAllIncidentTypes.useQuery();

  // Debounce location search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedLocationSearch(locationSearch);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationSearch]);

  // Location search with debounced value
  const searchLocation = trpc.anonymousReports.searchLocation.useQuery(
    { searchTerm: debouncedLocationSearch },
    {
      enabled: debouncedLocationSearch.length > 2,
      staleTime: 5000, // Reduced to 5 seconds
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  // Handle location search results
  const handleLocationSearchResults = useCallback(() => {
    if (searchLocation.data?.data) {
      // Ensure data is an array before setting
      const locationData = searchLocation.data.data;
      if (Array.isArray(locationData)) {
        setLocations(locationData);
      } else {
        console.warn("Location data is not an array:", locationData);
        setLocations([]);
      }
    } else if (searchLocation.error) {
      console.error("Location search error:", searchLocation.error);
      setLocations([]);
    }
  }, [searchLocation.data, searchLocation.error]);

  useEffect(() => {
    handleLocationSearchResults();
  }, [handleLocationSearchResults]);

  // Initialize form using shadcn Form pattern
  const form = useForm<AlertSubscriptionFormData>({
    resolver: zodResolver(alertSubscriptionFormSchema as any),
    mode: "onChange",
    defaultValues: {
      email: "",
      name: "",
      incidentTypes: [],
      location: "",
      severityLevel: 0,
      alertFrequency: "immediate" as const,
      emailNotifications: true,
      preferredLanguage: "en",
      timezone: "UTC",
    },
  });

  // Submit mutation
  const createSubscription = trpc.alertSubscriptions.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      setSelectedLocation(null);
      setLocationSearch("");
    },
    onError: (error) => {
      toast.error(error.message || t("subscribeFailed"));
    },
  });

  // Handle location selection
  const handleLocationSelect = useCallback(
    (location: SelectedLocation) => {
      console.log("Selected location:", location);
      setSelectedLocation(location);
      form.setValue("location", location.display_name);
      setLocationSearch(location.display_name);
      setLocations([]);
    },
    [form],
  );

  // Handle validation errors
  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);

    // Show toast for the first error encountered
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      const firstError = errorFields[0];
      const errorMessage = errors[firstError]?.message;

      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        // Fallback generic message
        toast.error(t("fillRequiredFields"));
      }
    }
  };

  const onSubmit = async (values: AlertSubscriptionFormData) => {
    if (!selectedLocation) {
      toast.error(t("selectValidLocation"));
      return;
    }

    try {
      // Extract location name from display_name if name is not available
      const locationName =
        selectedLocation.name ||
        selectedLocation.display_name.split(",")[0]?.trim() ||
        "Selected Location";

      // Convert severity level slider value to array of levels
      // 0 = all levels, 1 = medium+, 2 = high+, 3 = critical only
      const severityLevels: ("low" | "medium" | "high" | "critical")[] =
        values.severityLevel === 0
          ? ["low", "medium", "high", "critical"]
          : values.severityLevel === 1
            ? ["medium", "high", "critical"]
            : values.severityLevel === 2
              ? ["high", "critical"]
              : ["critical"];

      // Convert the simplified form data to the format expected by the API
      const subscriptionData = {
        email: values.email,
        name: values.name,
        incidentTypes: values.incidentTypes,
        locations: [
          {
            name: locationName,
            country:
              selectedLocation.display_name.split(",").slice(-1)[0]?.trim() ||
              "Unknown",
            radius: values.radius,
            lat: parseFloat(String(selectedLocation.lat)) || 0,
            lon: parseFloat(String(selectedLocation.lon)) || 0,
          },
        ],
        severityLevels,
        emailNotifications: values.emailNotifications,
        smsNotifications: false, // Removed SMS option
        alertFrequency: values.alertFrequency,
        preferredLanguage: values.preferredLanguage,
        timezone: values.timezone,
      };

      console.log("Submitting subscription data:", subscriptionData);
      await createSubscription.mutateAsync(subscriptionData);
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-none rounded-2xl border-none py-6">
      {/* <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Subscribe to Incident Alerts
        </CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-6 pt-px">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("namePlaceholder")}
                        {...field}
                        className="shadow-none placeholder:text-sm text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        {...field}
                        className="shadow-none placeholder:text-sm text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* <Separator /> */}

            {/* Incident Types */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="incidentTypes"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="sr-only">Incident Types</FormLabel>
                    <Popover
                      open={isIncidentTypesOpen}
                      onOpenChange={setIsIncidentTypesOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between bg-transparent border-input rounded-md text-sm shadow-none text-dark/60 font-medium",
                              !field.value?.length &&
                                "text-muted-foreground/75",
                            )}
                          >
                            {field.value?.length > 0
                              ? `${field.value.length} ${t("incidentTypesSelected")}`
                              : t("selectIncidentTypes")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full max-w-[625px] p-0">
                        <Command>
                          <CommandInput
                            placeholder={t("searchIncidentTypes")}
                          />
                          <CommandEmpty>
                            {t("noIncidentTypesFound")}
                          </CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {isLoadingTypes ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="ml-2">{t("loading")}</span>
                                </div>
                              ) : (
                                incidentTypesData?.data?.map((type: any) => (
                                  <CommandItem
                                    key={type.id}
                                    value={type.name}
                                    onSelect={() => {
                                      const currentValue = field.value || [];
                                      const newValue = currentValue.includes(
                                        type.name,
                                      )
                                        ? currentValue.filter(
                                            (item) => item !== type.name,
                                          )
                                        : [...currentValue, type.name];
                                      field.onChange(newValue);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(type.name)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <span>{type.name}</span>
                                    {type.description && (
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        - {type.description}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="text-xs"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* <Separator /> */}

            {/* Location */}
            <div className="flex flex-col md:flex-row gap-4 ">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2 flex">
                    <FormLabel className="sr-only">Location</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild className="">
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between bg-transparent border-input rounded-md text-sm shadow-none text-dark/60 font-medium",
                              !selectedLocation && "text-muted-foreground/75",
                            )}
                          >
                            <span className="truncate">
                              {selectedLocation
                                ? selectedLocation.display_name
                                : "Search for a location..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[305px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t("searchLocation")}
                            value={locationSearch}
                            onValueChange={setLocationSearch}
                          />
                          <CommandList>
                            {searchLocation.isLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2 text-sm">
                                  {t("searching")}
                                </span>
                              </div>
                            ) : locations.length === 0 &&
                              locationSearch.length > 2 ? (
                              <CommandEmpty>
                                {t("noLocationsFoundSearch")}
                              </CommandEmpty>
                            ) : locations.length === 0 ? (
                              <div className="p-4 text-sm text-muted-foreground text-center">
                                {t("typeToSearch")}
                              </div>
                            ) : Array.isArray(locations) &&
                              locations.length > 0 ? (
                              <CommandGroup>
                                {locations.map((location, index) => (
                                  <CommandItem
                                    key={index}
                                    value={location.display_name}
                                    onSelect={() => {
                                      handleLocationSelect(location);
                                      field.onChange(location.display_name);
                                    }}
                                  >
                                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="font-medium truncate">
                                        {location.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {location.display_name}
                                      </span>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4 shrink-0",
                                        selectedLocation?.display_name ===
                                          location.display_name
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ) : (
                              <CommandEmpty>
                                {t("unableToLoadLocations")}
                              </CommandEmpty>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {/* {selectedLocation && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {selectedLocation.display_name}
                        </span>
                      </div>
                    )} */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2 relative">
                    <FormControl>
                      <Input
                        min="1"
                        max="100"
                        placeholder="Radius"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="shadow-none placeholder:text-sm text-sm"
                      />
                    </FormControl>
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 items-center justify-end">
                      <FormLabel className="sr-only">{t("radius")}</FormLabel>
                      <Popover>
                        <PopoverTrigger
                          asChild
                          className="hover:cursor-pointer"
                        >
                          <FaRegCircleQuestion className="h-[12px] w-[12px] text-gray-500" />
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs">
                          <FormDescription>
                            {t("radiusDescription")}
                          </FormDescription>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage className="absolute -bottom-6" />
                  </FormItem>
                )}
              />
            </div>

            {/* <Separator /> */}

            {/* Severity Level */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="severityLevel"
                render={({ field }) => (
                  <FormItem className="">
                    <FormLabel className="pb-1 sr-only">
                      {t("minimumSeverity")}
                    </FormLabel>
                    <FormDescription className="text-sm text-muted-foreground/75">
                      {t("minimumSeverity")}
                    </FormDescription>
                    <div className="py-2">
                      <FormControl>
                        <Slider
                          min={0}
                          max={3}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <div className="flex justify-between mt-4 px-1">
                        {SEVERITY_LEVELS.map((level, index) => (
                          <div
                            key={level.value}
                            className="flex flex-col items-center gap-1"
                          >
                            <Badge
                              onClick={() => field.onChange(index)}
                              className={cn(
                                level.color,
                                "shadow-none text-xs cursor-pointer transition-all hover:scale-105",
                                field.value === index &&
                                  "ring-2 ring-primary ring-offset-2",
                              )}
                            >
                              {t(`severity${level.label}` as any)}
                            </Badge>
                            {/* <span className="text-xs text-muted-foreground">
                              {index === 0 && "All"}
                              {index === 1 && "Med+"}
                              {index === 2 && "High+"}
                              {index === 3 && "Only"}
                            </span> */}
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alert Frequency */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="alertFrequency"
                render={({ field }) => (
                  <FormItem className="">
                    <FormDescription className="text-sm text-muted-foreground/75">
                      {t("frequency")}
                    </FormDescription>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        {ALERT_FREQUENCIES.map((frequency) => (
                          <div
                            key={frequency.value}
                            onClick={() => field.onChange(frequency.value)}
                            className={cn(
                              "flex flex-col items-start gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                              field.value === frequency.value
                                ? "border-primary bg-primary/5"
                                : "border-gray-200",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  field.value === frequency.value
                                    ? "border-primary"
                                    : "border-gray-300",
                                )}
                              >
                                {field.value === frequency.value && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium text-sm">
                                {t(
                                  `frequency${frequency.label.replace(" ", "")}` as any,
                                )}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">
                              {t(
                                `frequency${frequency.label.replace(" ", "")}Desc` as any,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <TextComponent className="border rounded-md p-4 italic lg:text-sm">
              {t("agreementText")}
            </TextComponent>

            {/* <Separator /> */}

            {/* Notification Preferences */}
            {/* <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Preferences</h3>

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Email Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive incident alerts via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div> */}
            <div className="flex justify-end pb-4 pt-2">
              <Button
                type="submit"
                className=""
                disabled={createSubscription.isPending}
              >
                {createSubscription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("creatingSubscription")}
                  </>
                ) : (
                  t("subscribe")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AlertSubscriptionForm;
