"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { MapPin, Check, ChevronDown, Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

// Must match entity.AlertFrequency in the Go API.
const ALERT_FREQUENCIES = ["immediate", "hourly", "daily"] as const;

const FREQUENCY_MESSAGE_KEYS = {
  immediate: "frequencyImmediate",
  hourly: "frequencyHourly",
  daily: "frequencyDaily",
} as const;

// The design has no severity picker, so subscriptions cover every level.
const ALL_SEVERITY_LEVELS: ("low" | "medium" | "high" | "critical")[] = [
  "low",
  "medium",
  "high",
  "critical",
];

interface SelectedLocation {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
}

const labelClassName = "font-title text-base font-medium text-dark md:text-lg";
const fieldClassName =
  "h-12 w-full rounded-md border-input bg-white px-4 font-title text-sm text-dark shadow-none placeholder:text-dark/70 md:text-base";

const AlertSubscriptionForm: React.FC = () => {
  const t = useTranslations("Alerts");
  const locale = useLocale();

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("validationEmailRequired"))
          .email(t("validationEmailInvalid")),
        name: z.string().min(1, t("validationNameRequired")),
        incidentTypes: z.array(z.string()).min(1, t("validationIncidentTypesRequired")),
        location: z.string().min(1, t("validationLocationRequired")),
        radius: z
          .number({ message: t("validationRadiusMin") })
          .min(1, t("validationRadiusMin"))
          .max(100, t("validationRadiusMax")),
        alertFrequency: z.enum(ALERT_FREQUENCIES),
        consent: z.boolean().refine((value) => value, t("consentRequired")),
      }),
    [t],
  );
  type AlertSubscriptionFormData = z.infer<typeof schema>;

  // State for location search and selection
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [isIncidentTypesOpen, setIsIncidentTypesOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>(null);

  const { data: incidentTypesData, isLoading: isLoadingTypes } =
    trpc.anonymousReports.getAllIncidentTypes.useQuery();

  // Debounce location search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedLocationSearch(locationSearch);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationSearch]);

  const searchLocation = trpc.anonymousReports.searchLocation.useQuery(
    { searchTerm: debouncedLocationSearch },
    {
      enabled: debouncedLocationSearch.length > 2,
      staleTime: 5000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  const locations = useMemo<SelectedLocation[]>(() => {
    const locationData = searchLocation.data?.data;
    if (!Array.isArray(locationData)) return [];
    // LocationIQ results are untyped JSON from the tRPC router.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return locationData.map((location: any) => ({
      name: location.display_name,
      display_name: location.display_name,
      lat: Number.parseFloat(location.lat),
      lon: Number.parseFloat(location.lon),
    }));
  }, [searchLocation.data]);

  const form = useForm<AlertSubscriptionFormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      name: "",
      incidentTypes: [],
      location: "",
      alertFrequency: "daily",
      consent: false,
    },
  });

  const createSubscription = trpc.alertSubscriptions.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || t("subscribeSuccess"));
      form.reset();
      setSelectedLocation(null);
      setLocationSearch("");
    },
    onError: (error) => {
      toast.error(error.message || t("subscribeFailed"));
    },
  });

  const handleLocationSelect = useCallback(
    (location: SelectedLocation) => {
      setSelectedLocation(location);
      form.setValue("location", location.display_name, { shouldValidate: true });
      setLocationSearch(location.display_name);
      setIsLocationOpen(false);
    },
    [form],
  );

  const onSubmit = async (values: AlertSubscriptionFormData) => {
    if (!selectedLocation) {
      toast.error(t("selectValidLocation"));
      return;
    }

    try {
      await createSubscription.mutateAsync({
        email: values.email,
        name: values.name,
        incidentTypes: values.incidentTypes,
        locations: [
          {
            radius: values.radius,
            lat: Number(selectedLocation.lat) || 0,
            lon: Number(selectedLocation.lon) || 0,
          },
        ],
        severityLevels: ALL_SEVERITY_LEVELS,
        emailNotifications: true,
        smsNotifications: false,
        alertFrequency: values.alertFrequency,
        preferredLanguage: locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
    } catch {
      // Surfaced by the mutation's onError toast.
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={labelClassName}>{t("nameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("writeHere")}
                    autoComplete="name"
                    className={fieldClassName}
                    {...field}
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
              <FormItem className="gap-2.5">
                <FormLabel className={labelClassName}>{t("emailLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t("writeHere")}
                    className={fieldClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="incidentTypes"
          render={({ field }) => (
            <FormItem className="gap-2.5">
              <FormLabel className={labelClassName}>
                {t("incidentTypeLabel")}
              </FormLabel>
              <Popover open={isIncidentTypesOpen} onOpenChange={setIsIncidentTypesOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <button
                      type="button"
                      className={cn(fieldClassName, "flex items-center justify-between border text-left")}
                    >
                      <span className="truncate">
                        {field.value?.length > 0
                          ? `${field.value.length} ${t("incidentTypesSelected")}`
                          : t("selectIncidentTypes")}
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-dark" />
                    </button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder={t("searchIncidentTypes")} />
                    <CommandEmpty>{t("noIncidentTypesFound")}</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {isLoadingTypes ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="ml-2">{t("loading")}</span>
                          </div>
                        ) : (
                          incidentTypesData?.data?.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={type.name}
                              onSelect={() => {
                                const current = field.value || [];
                                field.onChange(
                                  current.includes(type.name)
                                    ? current.filter((item) => item !== type.name)
                                    : [...current, type.name],
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  field.value?.includes(type.name) ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span>{type.name}</span>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {field.value?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
          <FormField
            control={form.control}
            name="location"
            render={() => (
              <FormItem className="gap-2.5">
                <FormLabel className={labelClassName}>
                  {t("incidentLocationLabel")}
                </FormLabel>
                <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <button
                        type="button"
                        className={cn(fieldClassName, "flex items-center justify-between border text-left")}
                      >
                        <span className={cn("truncate", !selectedLocation && "text-dark/70")}>
                          {selectedLocation ? selectedLocation.display_name : t("location")}
                        </span>
                        <MapPin className="size-4 shrink-0 text-dark/50" />
                      </button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={t("searchLocation")}
                        value={locationSearch}
                        onValueChange={setLocationSearch}
                      />
                      <CommandList>
                        {searchLocation.isFetching ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="ml-2 text-sm">{t("searching")}</span>
                          </div>
                        ) : locations.length === 0 && locationSearch.length > 2 ? (
                          <CommandEmpty>{t("noLocationsFoundSearch")}</CommandEmpty>
                        ) : locations.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {t("typeToSearch")}
                          </div>
                        ) : (
                          <CommandGroup>
                            {locations.map((location, index) => (
                              <CommandItem
                                key={`${location.display_name}-${index}`}
                                value={location.display_name}
                                onSelect={() => handleLocationSelect(location)}
                              >
                                <MapPin className="mr-2 size-4 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">
                                  {location.display_name}
                                </span>
                                <Check
                                  className={cn(
                                    "ml-2 size-4 shrink-0",
                                    selectedLocation?.display_name === location.display_name
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="radius"
            render={({ field }) => (
              <FormItem className="gap-2.5">
                <FormLabel className={labelClassName}>{t("radiusLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    placeholder={t("radiusPlaceholder")}
                    className={fieldClassName}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="alertFrequency"
          render={({ field }) => (
            <FormItem className="mt-4 gap-2.5">
              <FormLabel className={labelClassName}>{t("frequency")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={cn(fieldClassName, "data-[size=default]:h-12 [&_svg]:text-dark [&_svg]:opacity-100")}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ALERT_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {t(FREQUENCY_MESSAGE_KEYS[frequency])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="gap-2">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5 size-4.5"
                  />
                </FormControl>
                <FormLabel className="font-title text-sm font-normal leading-snug text-dark">
                  {t("agreementText")}
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createSubscription.isPending}
          className="h-12 w-full rounded-full font-title text-base md:text-lg"
        >
          {createSubscription.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("creatingSubscription")}
            </>
          ) : (
            <>
              {t("subscribe")}
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AlertSubscriptionForm;
