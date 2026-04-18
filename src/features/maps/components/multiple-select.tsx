"use client";

import { useState } from "react";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/muliple-select";
import { useQueryState } from "nuqs";

const people: MultiSelectOption[] = [
  { value: "anonymous", label: "Anonymous Reports" },
  { value: "organization", label: "Organization Reports" },
];

const MultipleSelect = () => {
  const [sources, setSources] = useQueryState<string[]>("sources", {
    defaultValue: ["anonymous", "organization"], // Default to both sources
    parse: (value) =>
      Array.isArray(value)
        ? value
        : typeof value === "string" && value
        ? value.split(",")
        : ["anonymous", "organization"], // Fallback to both sources
    serialize: (value) => value.join(","),
  });

  return (
    <div>
      <MultiSelect
        options={people}
        value={sources}
        onValueChange={setSources}
        placeholder="Sources"
        className="w-full shadow-none bg-white"
      />
    </div>
  );
};

export default MultipleSelect;
