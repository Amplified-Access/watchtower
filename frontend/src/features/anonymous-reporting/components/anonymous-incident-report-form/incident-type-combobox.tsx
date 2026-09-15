"use client";

import { useState } from "react";
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
import { Check, ChevronDown } from "lucide-react";
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
import { reportFieldClassName, reportLabelClassName } from "./field-styles";

const IncidentTypeCombobox = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("IncidentReporting");
  const incidentCategories = trpc.anonymousReports.getAllIncidentTypes.useQuery();
  const categories = incidentCategories.data?.data || [];

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => {
        const selected = categories.find((category) => category.id === field.value);
        return (
          <FormItem className="gap-2.5">
            <FormLabel className={reportLabelClassName}>{t("categoryLabel")}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <button
                    type="button"
                    className={cn(
                      reportFieldClassName,
                      "flex items-center justify-between text-left",
                      !selected && "text-dark/70",
                    )}
                  >
                    <span className="truncate">
                      {selected?.name ?? t("selectIncidentTypeCombo")}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-dark" />
                  </button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("searchCategory")} className="h-9" />
                  <CommandList>
                    <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            form.setValue("category", category.id, { shouldValidate: true });
                            setOpen(false);
                          }}
                        >
                          {category.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              field.value === category.id ? "opacity-100" : "opacity-0",
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
        );
      }}
    />
  );
};

export default IncidentTypeCombobox;
