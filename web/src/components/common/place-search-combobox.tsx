"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2 } from "lucide-react";
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
import { usePlaceSearch } from "@/hooks/use-place-search";
import { cn } from "@/lib/utils";

/** A place picked from Google's suggestions, as the forms store it. */
export interface PickedPlace {
  placeId: string;
  /** What the user picked, in their language ("Kampala Road, Kampala, Uganda"). */
  label: string;
  /** The full address, in English. */
  address: string;
  /** The country's English name, as the maps group reports by it. */
  country: string | null;
  latitude: number;
  longitude: number;
}

type PlaceSearchComboboxProps = Omit<ComponentProps<"button">, "value" | "onChange"> & {
  value: Pick<PickedPlace, "placeId" | "label"> | null | undefined;
  onChange: (place: PickedPlace) => void;
  /** Shown on the button until a place is picked. */
  placeholder: string;
  /** The button's icon; a chevron by default. */
  icon?: ReactNode;
  contentClassName?: string;
};

/**
 * A button that opens a Google location search (see usePlaceSearch), for
 * every form that asks where something is. Other props go to the button, so
 * it can sit inside a FormControl.
 */
const PlaceSearchCombobox = ({
  value,
  onChange,
  placeholder,
  icon,
  className,
  contentClassName,
  ...buttonProps
}: PlaceSearchComboboxProps) => {
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
      onChange({
        placeId: place.placeId,
        label,
        address: place.address,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
      });
      setOpen(false);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setPendingPlaceId(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          {...buttonProps}
          className={cn("flex items-center justify-between gap-2 text-left", className)}
        >
          <span className={cn("truncate", !value?.label && "opacity-70")}>
            {value?.label || placeholder}
          </span>
          {icon ?? <ChevronDown className="size-4 shrink-0" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-(--radix-popover-trigger-width) min-w-72 p-0", contentClassName)}
        align="start"
      >
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
                            value?.placeId === placeId ? "opacity-100" : "opacity-0",
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
  );
};

export default PlaceSearchCombobox;
