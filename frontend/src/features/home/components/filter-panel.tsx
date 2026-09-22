"use client";

import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DateRange, TimePeriod } from "../hooks/use-live-preview-data";

interface IncidentTypeOption {
  id: string;
  name: string;
}

interface FilterPanelProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  incidentTypes: IncidentTypeOption[];
  /** Categories switched off; everything not listed here is on. */
  hiddenCategoryIds: string[];
  onToggleCategory: (id: string) => void;
  totalReports: number;
  onReset: () => void;
  /** "dark" floats over the homepage preview; "light" is the docked live map panel. */
  variant?: "dark" | "light";
  /** Rendered after "Reset all", e.g. a collapse button. */
  headerAction?: React.ReactNode;
  /** When set, the footer CTA runs this instead of linking to /maps. */
  onViewReports?: () => void;
  /** Countries to filter by. The section only renders when this is passed. */
  countries?: string[];
  country?: string | null;
  onCountryChange?: (country: string | null) => void;
}

const STYLES = {
  dark: {
    root: "gap-6 p-5 lg:w-72",
    label: "text-[11px] font-semibold uppercase tracking-widest text-white/40",
    reset: "text-xs font-medium text-primary hover:text-primary/80",
    chip: "rounded-full px-3 py-1.5 text-xs font-medium",
    chipIdle: "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
    popover: "bg-dark text-white",
    dateLabel: "text-white/60",
    dateInput: "border-white/15 bg-white/5 text-white",
    verification: "w-fit gap-1 rounded-full bg-white/5 p-1",
    verificationItem: "rounded-full px-3 py-1 text-xs font-medium",
    verificationActive: "bg-white/10 text-white",
    verificationIdle: "text-white/50",
    layerLabel: "text-sm text-white/80",
    cta: "rounded-lg py-2.5 text-sm font-semibold",
  },
  light: {
    root: "gap-7 px-6 py-6",
    label: "font-title text-xs font-medium uppercase tracking-wide text-dark",
    reset: "font-title text-sm text-primary hover:text-primary/80",
    chip: "h-9 rounded-sm px-3 font-title text-sm uppercase",
    chipIdle: "bg-dark/5 text-dark hover:bg-dark/10",
    popover: "",
    dateLabel: "text-dark/60",
    dateInput: "border-input bg-white text-dark",
    verification: "grid grid-cols-3 gap-3",
    verificationItem: "rounded-sm border px-2 py-1.5 text-center font-title text-sm",
    verificationActive: "border-primary bg-primary text-white",
    verificationIdle: "border-dark/40 text-dark",
    layerLabel: "font-title text-sm text-dark",
    cta: "h-14 rounded-sm font-title text-sm",
  },
} as const;

const PERIODS: { value: TimePeriod; labelKey: string }[] = [
  { value: "24h", labelKey: "period24h" },
  { value: "7d", labelKey: "period7d" },
  { value: "30d", labelKey: "period30d" },
];

const FilterPanel = ({
  timePeriod,
  onTimePeriodChange,
  customRange,
  onCustomRangeChange,
  incidentTypes,
  hiddenCategoryIds,
  onToggleCategory,
  totalReports,
  onReset,
  variant = "dark",
  headerAction,
  onViewReports,
  countries,
  country = null,
  onCountryChange,
}: FilterPanelProps) => {
  const t = useTranslations("HomeLivePreview");
  const s = STYLES[variant];

  return (
    <div className={cn("flex h-full w-full shrink-0 flex-col", s.root)}>
      <div className="flex items-center justify-between gap-3">
        <span className={s.label}>{t("filterReports")}</span>
        <span className="flex items-center gap-4">
          <button type="button" onClick={onReset} className={s.reset}>
            {t("resetAll")}
          </button>
          {headerAction}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className={s.label}>
          {t("timePeriod")}
        </span>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onTimePeriodChange(period.value)}
              className={cn(
                "transition-colors",
                s.chip,
                timePeriod === period.value ? "bg-primary text-white" : s.chipIdle,
              )}
            >
              {t(period.labelKey)}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => onTimePeriodChange("custom")}
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  s.chip,
                  variant === "light" && "flex-1 flex-row-reverse justify-between",
                  timePeriod === "custom" ? "bg-primary text-white" : s.chipIdle,
                )}
              >
                <Calendar className={variant === "light" ? "size-5" : "size-3.5"} />
                {t("periodCustom")}
              </button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-64", s.popover)}>
              <div className="flex flex-col gap-3">
                <label className={cn("flex flex-col gap-1 text-xs", s.dateLabel)}>
                  From
                  <input
                    type="date"
                    value={customRange.from ?? ""}
                    onChange={(e) =>
                      onCustomRangeChange({ ...customRange, from: e.target.value })
                    }
                    className={cn("rounded-md border px-2 py-1.5 text-sm", s.dateInput)}
                  />
                </label>
                <label className={cn("flex flex-col gap-1 text-xs", s.dateLabel)}>
                  To
                  <input
                    type="date"
                    value={customRange.to ?? ""}
                    onChange={(e) =>
                      onCustomRangeChange({ ...customRange, to: e.target.value })
                    }
                    className={cn("rounded-md border px-2 py-1.5 text-sm", s.dateInput)}
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {countries && countries.length > 0 && onCountryChange && (
        <div className="flex flex-col gap-2">
          <span className={s.label}>{t("country")}</span>
          <div className="flex flex-wrap gap-2">
            {countries.map((name) => {
              const active = country === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  // Clicking the active country again clears the filter.
                  onClick={() => onCountryChange(active ? null : name)}
                  className={cn(
                    "transition-colors",
                    s.chip,
                    active ? "bg-primary text-white" : s.chipIdle,
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className={s.label}>
          {t("issuesCategory")}
        </span>
        {incidentTypes.map((type) => (
          <div key={type.id} className="flex items-center justify-between gap-3">
            <span className={s.layerLabel}>{type.name}</span>
            <Switch
              checked={!hiddenCategoryIds.includes(type.id)}
              onCheckedChange={() => onToggleCategory(type.id)}
              aria-label={type.name}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className={s.label}>
          {t("verificationStatus")}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex opacity-40", s.verification)}>
              {[t("verificationAll"), t("verificationReviewed"), t("verificationVerified")].map(
                (label, i) => (
                  <span
                    key={label}
                    className={cn(
                      "cursor-not-allowed",
                      s.verificationItem,
                      i === 0 ? s.verificationActive : s.verificationIdle,
                    )}
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("verificationUnavailable")}</TooltipContent>
        </Tooltip>
      </div>

      {onViewReports ? (
        <button
          type="button"
          onClick={onViewReports}
          className={cn(
            "mt-auto flex items-center justify-center bg-primary px-4 text-white transition-colors hover:bg-primary/90",
            s.cta,
          )}
        >
          {t("viewReportsCta", { count: totalReports })}
        </button>
      ) : (
        <Link
          href="/maps"
          className={cn(
            "mt-auto flex items-center justify-center bg-primary px-4 text-white transition-colors hover:bg-primary/90",
            s.cta,
          )}
        >
          {t("viewReportsCta", { count: totalReports })}
        </Link>
      )}
    </div>
  );
};

export default FilterPanel;
