"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import z from "zod";
import {
  formSchema,
  LocationData,
} from "../../schemas/anonymous-incident-reproting-form-schema";
import { reportFieldClassName, reportLabelClassName } from "./field-styles";

const MIN_SEARCH_LENGTH = 3;

const IncidentLocationCombobox = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("IncidentReporting");

  // Search as the user types, debounced so LocationIQ isn't hit per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const response = trpc.anonymousReports.searchLocation.useQuery(
    { searchTerm },
    { enabled: searchTerm.length >= MIN_SEARCH_LENGTH },
  );
  const results: LocationData[] = Array.isArray(response.data?.data)
    ? response.data.data
    : [];

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem className="gap-2.5">
          <FormLabel className={reportLabelClassName}>{t("locationLabel")}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <button
                  type="button"
                  className={cn(
                    reportFieldClassName,
                    "flex items-center justify-between text-left",
                    !field.value?.display_name && "text-dark/70",
                  )}
                >
                  <span className="truncate">
                    {field.value?.display_name || t("locationPickerPlaceholder")}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-dark" />
                </button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={t("searchLocation")}
                  className="h-9"
                  value={searchInput}
                  onValueChange={setSearchInput}
                />
                <CommandList>
                  {searchInput.trim().length < MIN_SEARCH_LENGTH ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t("typeToSearch")}
                    </div>
                  ) : response.isFetching || searchTerm !== searchInput.trim() ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {t("loadingLocations")}
                    </div>
                  ) : results.length === 0 ? (
                    <CommandEmpty>{t("noLocationFound")}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {results.map((location) => (
                        <CommandItem
                          key={location.place_id}
                          value={location.place_id}
                          onSelect={() => {
                            form.setValue("location", location, { shouldValidate: true });
                            setOpen(false);
                          }}
                        >
                          <span className="min-w-0 flex-1 truncate">{location.display_name}</span>
                          <Check
                            className={cn(
                              "ml-2 shrink-0",
                              field.value?.place_id === location.place_id
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
  );
};

export default IncidentLocationCombobox;
