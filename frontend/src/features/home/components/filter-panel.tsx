"use client";

import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface LayerToggles {
  reports: boolean;
  clusters: boolean;
  heatmap: boolean;
  boundaries: boolean;
}

interface FilterPanelProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  incidentTypes: IncidentTypeOption[];
  layers: LayerToggles;
  onLayersChange: (layers: LayerToggles) => void;
  totalReports: number;
  onReset: () => void;
}

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
  categoryId,
  onCategoryChange,
  incidentTypes,
  layers,
  onLayersChange,
  totalReports,
  onReset,
}: FilterPanelProps) => {
  const t = useTranslations("HomeLivePreview");

  const layerRows: { key: keyof LayerToggles; labelKey: string }[] = [
    { key: "reports", labelKey: "layerReports" },
    { key: "clusters", labelKey: "layerClusters" },
    { key: "heatmap", labelKey: "layerHeatmap" },
    { key: "boundaries", labelKey: "layerCountryBoundaries" },
  ];

  return (
    <div className="flex h-full w-full shrink-0 flex-col gap-6 border-white/10 p-5 lg:w-72 lg:border-l">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("filterReports")}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-primary hover:text-primary/80"
        >
          {t("resetAll")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("timePeriod")}
        </span>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onTimePeriodChange(period.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                timePeriod === period.value
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
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
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  timePeriod === "custom"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                )}
              >
                <Calendar className="size-3.5" />
                {t("periodCustom")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-dark text-white">
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  From
                  <input
                    type="date"
                    value={customRange.from ?? ""}
                    onChange={(e) =>
                      onCustomRangeChange({ ...customRange, from: e.target.value })
                    }
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/60">
                  To
                  <input
                    type="date"
                    value={customRange.to ?? ""}
                    onChange={(e) =>
                      onCustomRangeChange({ ...customRange, to: e.target.value })
                    }
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("issuesCategory")}
        </span>
        <Select
          value={categoryId ?? "all"}
          onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
            <SelectValue placeholder={t("allIssues")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allIssues")}</SelectItem>
            {incidentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("verificationStatus")}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-fit gap-1 rounded-full bg-white/5 p-1 opacity-40">
              {[t("verificationAll"), t("verificationReviewed"), t("verificationVerified")].map(
                (label, i) => (
                  <span
                    key={label}
                    className={cn(
                      "cursor-not-allowed rounded-full px-3 py-1 text-xs font-medium",
                      i === 0 ? "bg-white/10 text-white" : "text-white/50",
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

      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("mapLayers")}
        </span>
        {layerRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="text-sm text-white/80">{t(row.labelKey)}</span>
            <Switch
              checked={layers[row.key]}
              onCheckedChange={(checked) =>
                onLayersChange({ ...layers, [row.key]: checked })
              }
            />
          </div>
        ))}
      </div>

      <Link
        href="/maps"
        className="mt-auto flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        {t("viewReportsCta", { count: totalReports })}
      </Link>
    </div>
  );
};

export default FilterPanel;
