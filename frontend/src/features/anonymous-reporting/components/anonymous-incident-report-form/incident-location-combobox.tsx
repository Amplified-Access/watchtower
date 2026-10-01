"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { usePlaceSearch } from "@/hooks/use-place-search";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import type { ReportFormValues } from "../../schemas/anonymous-incident-reproting-form-schema";
import { reportFieldClassName, reportLabelClassName } from "./field-styles";

// Where the incident happened, searched with Google Places: suggestions while
// the reporter types, then the picked place's coordinates and country.
const IncidentLocationCombobox = ({
  form,
}: {
  form: UseFormReturn<ReportFormValues>;
}) => {
  const [open, setOpen] = useState(false);
  // The place being looked up after a click, until its coordinates arrive.
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
  const t = useTranslations("IncidentReporting");
  const tCommon = useTranslations("Common");
  const { query, setQuery, suggestions, tooShort, isSearching, select } = usePlaceSearch();

  const choose = async (placeId: string, label: string) => {
    setPendingPlaceId(placeId);
    try {
      const place = await select(placeId);
      form.setValue(
        "location",
        {
          placeId: place.placeId,
          label,
          address: place.address,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
        },
        { shouldValidate: true },
      );
      setOpen(false);
      setQuery("");
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setPendingPlaceId(null);
    }
  };

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
                    !field.value?.label && "text-dark/70",
                  )}
                >
                  <span className="truncate">
                    {field.value?.label || t("locationPickerPlaceholder")}
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
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  {tooShort ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t("typeToSearch")}
                    </div>
                  ) : isSearching ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {t("loadingLocations")}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <CommandEmpty>{t("noLocationFound")}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {suggestions.map(({ placeId, mainText, secondaryText }) => {
                        const label = secondaryText ? `${mainText}, ${secondaryText}` : mainText;
                        return (
                          <CommandItem
                            key={placeId}
                            value={placeId}
                            disabled={pendingPlaceId !== null}
                            onSelect={() => void choose(placeId, label)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{mainText}</div>
                              {secondaryText && (
                                <div className="truncate text-xs text-muted-foreground">{secondaryText}</div>
                              )}
                            </div>
                            {pendingPlaceId === placeId ? (
                              <Loader2 className="ml-2 size-4 shrink-0 animate-spin" />
                            ) : (
                              <Check
                                className={cn(
                                  "ml-2 shrink-0",
                                  field.value?.placeId === placeId ? "opacity-100" : "opacity-0",
                                )}
                              />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
                {/* Google's terms require attribution when Places results are
                    shown without a Google map. The brand isn't translated. */}
                {!tooShort && (
                  <p className="border-t border-border px-3 py-1.5 text-right text-[11px] text-muted-foreground">
                    Google Maps
                  </p>
                )}
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
