"use client";

import { useState } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import z from "zod";
import { formSchema } from "../../schemas/anonymous-incident-reproting-form-schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const IncidentTypeCombobox = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("IncidentReporting");
  const incidentCategories =
    trpc.anonymousReports.getAllIncidentTypes.useQuery();

  console.log(
    incidentCategories.data?.success
      ? "Fetched  incidents"
      : "Failed to retrieve incidents",
  );
  const categories = incidentCategories.data?.data || [];

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("incidentCategory")}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={`rounded-md justify-between text-dark text-sm border-muted-foreground/10 shadow-xs hover:bg-white hover:text-dark bg-white ${
                    !field.value && "text-muted-foreground "
                  }`}
                >
                  {field.value
                    ? categories.find((category) => category.id === field.value)
                        ?.name
                    : t("selectIncidentTypeCombo")}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[500px] p-0">
              <Command>
                <CommandInput
                  placeholder={t("searchCategory")}
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => {
                          form.setValue("category", category.id);
                          setOpen(false);
                        }}
                      >
                        {category.name}
                        <Check
                          className={cn(
                            "ml-auto",
                            field.value === category.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
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

export default IncidentTypeCombobox;
