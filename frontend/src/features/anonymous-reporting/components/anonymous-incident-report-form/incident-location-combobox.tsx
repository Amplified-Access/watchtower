"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import z from "zod";
import {
  formSchema,
  LocationData,
} from "../../schemas/anonymous-incident-reproting-form-schema";

const IncidentLocationCombobox = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("IncidentReporting");
  const tCommon = useTranslations("Common");

  // Only fetch when searchTerm changes (i.e., when button is pressed)
  const response = trpc.anonymousReports.searchLocation.useQuery(
    { searchTerm },
    { enabled: !!searchTerm },
  );

  if (response.isSuccess) {
    console.log("Response data: ", response.data);
  }

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(
      '[placeholder="Search..."]',
    );
    if (!input) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchInput.trim()) {
        setSearchTerm(searchInput);
        e.preventDefault();
      }
    };

    input.addEventListener("keydown", handleKeyDown);

    return () => {
      input.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchInput]);

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("location")}</FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`rounded-md justify-between text-dark text-sm border-muted-foreground/10 shadow-xs hover:bg-white hover:text-dark bg-white w-full ${
                      (!field.value || !field.value.display_name) &&
                      "text-muted-foreground "
                    }`}
                  >
                    <p className={"max-w-md line-clamp-1 overflow-hidden"}>
                      {field.value?.display_name || t("selectLocation")}
                    </p>
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command shouldFilter={false}>
                  <div className="flex gap-2 items-center p-2 w-full">
                    <div className="w-full">
                      <CommandInput
                        placeholder={t("searchPlaceholder")}
                        className="h-9 flex-1 w-full"
                        value={searchInput}
                        onValueChange={setSearchInput}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSearchTerm(searchInput)}
                      disabled={!searchInput.trim()}
                    >
                      {tCommon("search")}
                    </Button>
                  </div>
                  <CommandList>
                    {response.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {t("loadingLocations")}
                      </div>
                    ) : (
                      <>
                        {!Array.isArray(response.data?.data) ||
                        response.data.data.length === 0 ? (
                          <CommandEmpty>{t("noLocationFound")}</CommandEmpty>
                        ) : null}
                        <CommandGroup>
                          {Array.isArray(response.data?.data) &&
                            response.data.data.map((location: LocationData) => (
                              <CommandItem
                                key={location.place_id}
                                value={location.place_id}
                                onSelect={() => {
                                  form.setValue("location", location);
                                  setOpen(false);
                                }}
                              >
                                {location.display_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    field.value?.place_id === location.place_id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default IncidentLocationCombobox;
