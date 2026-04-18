"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
}

function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select items...",
  className,
  size = "default",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue];
    onValueChange?.(newValue);
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  return (
    <SelectPrimitive.Root open={open} onOpenChange={setOpen}>
      <SelectPrimitive.Trigger
        data-slot="multi-select-trigger"
        data-size={size}
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-start justify-between gap-2 rounded-md border bg-transparent px-1 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 min-h-9",
          size === "sm" && "min-h-8",
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <div
                key={option.value}
                className="bg-secondary text-secondary-foreground inline-flex items-center rounded px-2 py-1.25 text-xs whitespace-nowrap shrink-0"
              >
                <span>{option.label}</span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground ps-2 py-0.5">
              {placeholder}
            </span>
          )}
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 mr-2 opacity-50 shrink-0 mt-0.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="multi-select-content"
          className={cn(
            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96  min-w-[8rem] overflow-hidden rounded-md border shadow-md"
          )}
          position="popper"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-[90px] pl-2 text-sm outline-hidden select-none"
                )}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {value.includes(option.value) && (
                    <CheckIcon className="size-4" />
                  )}
                </span>
                <span>{option.label}</span>
              </div>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { MultiSelect, type MultiSelectOption, type MultiSelectProps };
