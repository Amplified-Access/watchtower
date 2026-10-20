"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ThematicTimeframe = "week" | "month" | "year";

const THEME_DESCRIPTIONS: Record<string, string> = {
  Battles:
    "Armed confrontations between organized groups including state forces, rebel groups, and militias.",
  "Explosions/Remote violence":
    "Incidents involving explosives, airstrikes, artillery, and other remote forms of violence.",
  Protests:
    "Peaceful demonstrations and organized public displays of opinion or dissent.",
  Riots:
    "Violent crowd actions and civil disorder involving public violence and property damage.",
  "Strategic developments":
    "Important political, military, or organizational changes that affect conflict dynamics.",
  "Violence against civilians":
    "Intentional attacks on non-combatants including killings, kidnappings, and other targeted violence.",
};

const TIMEFRAMES: { value: ThematicTimeframe; labelKey: string }[] = [
  { value: "week", labelKey: "period7d" },
  { value: "month", labelKey: "period30d" },
  { value: "year", labelKey: "period1y" },
];

// Same classes as the live map's light FilterPanel, so the two docked panels
// read as one design. Keep them in step with STYLES.light there.
const labelClassName = "font-title text-xs font-medium uppercase tracking-wide text-dark";
const chipClassName = "h-9 rounded-sm px-3 font-title text-sm uppercase transition-colors";
const chipIdleClassName = "bg-dark/5 text-dark hover:bg-dark/10";

interface ThematicMapFilterPanelProps {
  theme: string;
  timeframe: ThematicTimeframe | null;
  onTimeframeChange: (timeframe: ThematicTimeframe | null) => void;
  /** Countries that have reports for this theme, so the list covers every region reported from. */
  countries: string[];
  country: string | null;
  onCountryChange: (country: string | null) => void;
  totalReports: number;
  onReset: () => void;
  onViewReports: () => void;
  /** Rendered after "Reset all": the collapse button. */
  headerAction?: ReactNode;
}

export function ThematicMapFilterPanel({
  theme,
  timeframe,
  onTimeframeChange,
  countries,
  country,
  onCountryChange,
  totalReports,
  onReset,
  onViewReports,
  headerAction,
}: ThematicMapFilterPanelProps) {
  const t = useTranslations("HomeLivePreview");

  return (
    <div className="flex min-h-full w-full flex-col gap-7 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <span className={labelClassName}>{t("filterReports")}</span>
        <span className="flex items-center gap-4">
          <button
            type="button"
            onClick={onReset}
            className="font-title text-sm text-primary hover:text-primary/80"
          >
            {t("resetAll")}
          </button>
          {headerAction}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClassName}>{t("timePeriod")}</span>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((option) => {
            const active = timeframe === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                // Clicking the active period again clears it back to all time.
                onClick={() => onTimeframeChange(active ? null : option.value)}
                className={cn(chipClassName, active ? "bg-primary text-white" : chipIdleClassName)}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {countries.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={labelClassName}>{t("country")}</span>
          <div className="flex flex-wrap gap-2">
            {countries.map((name) => {
              const active = country === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCountryChange(active ? null : name)}
                  className={cn(chipClassName, active ? "bg-primary text-white" : chipIdleClassName)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* These descriptions only cover the original ACLED-style themes; the
          incident types this app ships with have no copy yet, so the panel
          is skipped rather than rendered as an empty box. */}
      {THEME_DESCRIPTIONS[theme] && (
        <div className="rounded-sm bg-dark/5 p-3">
          <h4 className="mb-2 font-title text-sm font-medium text-dark">About {theme}</h4>
          <p className="text-xs text-dark/60">{THEME_DESCRIPTIONS[theme]}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onViewReports}
        className="mt-auto flex h-14 items-center justify-center rounded-sm bg-primary px-4 font-title text-sm text-white transition-colors hover:bg-primary/90"
      >
        {t("viewReportsCta", { count: totalReports })}
      </button>
    </div>
  );
}
