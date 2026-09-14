"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TopChip } from "../hooks/use-live-preview-data";

interface SearchAndChipsProps {
  search: string;
  onSearchChange: (value: string) => void;
  chips: TopChip[];
  activeCountry: string | null;
  activeCategoryId: string | null;
  onToggleChip: (chip: TopChip) => void;
}

const SearchAndChips = ({
  search,
  onSearchChange,
  chips,
  activeCountry,
  activeCategoryId,
  onToggleChip,
}: SearchAndChipsProps) => {
  const t = useTranslations("HomeLivePreview");

  const isChipActive = (chip: TopChip) =>
    chip.kind === "country" ? activeCountry === chip.value : activeCategoryId === chip.value;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
        <Search className="size-4 shrink-0 text-white/40" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.kind}-${chip.value}`}
              type="button"
              onClick={() => onToggleChip(chip)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isChipActive(chip)
                  ? "border-primary bg-primary text-white"
                  : "border-white/15 text-white/70 hover:border-white/30 hover:text-white",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAndChips;
