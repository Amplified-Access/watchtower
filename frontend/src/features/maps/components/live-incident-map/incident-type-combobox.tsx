"use client";

import { useState } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQueryState } from "nuqs";

const IncidentTypeCombobox = () => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useQueryState("category");
  const incidentCategories =
    trpc.anonymousReports.getAllIncidentTypes.useQuery();

  console.log(
    incidentCategories.data?.success
      ? "Fetched  incidents"
      : "Failed to retrieve incidents",
  );
  const allowedNames = [
    "Public demonstrations",
    "Election Irregularities",
    "Abuse of office",
    "Community petitions",
    "Police misconduct",
    "Misuse of public funds",
  ];
  const categories = (incidentCategories.data?.data || []).filter((category) =>
    allowedNames.includes(category.name),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`rounded-md justify-between text-dark text-sm border-muted-foreground/10 shadow-xs hover:bg-white hover:text-dark bg-white ${
            !selectedCategory ||
            (selectedCategory == "" && "text-muted-foreground ")
          }`}
        >
          {selectedCategory
            ? categories.find((category) => category.name === selectedCategory)
                ?.name
            : "Select incident type..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-125 p-0">
        <Command>
          <CommandInput placeholder="Search Category..." className="h-9" />
          <CommandList>
            <CommandEmpty>No category found</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name || ""}
                  onSelect={() => {
                    setSelectedCategory(category.name);
                    setOpen(false);
                  }}
                >
                  {category.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedCategory === category.name
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
  );
};

export default IncidentTypeCombobox;
