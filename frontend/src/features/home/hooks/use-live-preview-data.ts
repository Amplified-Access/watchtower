"use client";

import { useMemo } from "react";
import { trpc } from "@/_trpc/client";
import { languages as supportedLanguages } from "@/components/common/language-selector";

export type TimePeriod = "24h" | "7d" | "30d" | "custom";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface ReportBubble {
  key: string;
  country: string | null;
  count: number;
  lat: number;
  lon: number;
}

export interface TopChip {
  kind: "country" | "category";
  label: string;
  value: string;
  count: number;
}

export interface LivePreviewFilters {
  timePeriod: TimePeriod;
  customRange: DateRange;
  /**
   * Categories switched off in the filter panel. Tracking what is hidden rather
   * than what is shown means the default (nothing hidden, everything visible)
   * does not have to wait for the incident type list to load.
   */
  hiddenCategoryIds: string[];
  search: string;
}

/** Flip one category's toggle. */
export const toggleCategoryVisibility = (hiddenCategoryIds: string[], id: string) =>
  hiddenCategoryIds.includes(id)
    ? hiddenCategoryIds.filter((hidden) => hidden !== id)
    : [...hiddenCategoryIds, id];

/** True when `id` is the only category left visible. */
export const isCategorySoloed = (
  hiddenCategoryIds: string[],
  incidentTypes: { id: string }[],
  id: string,
) =>
  incidentTypes.length > 1 &&
  !hiddenCategoryIds.includes(id) &&
  incidentTypes.every((type) => type.id === id || hiddenCategoryIds.includes(type.id));

/**
 * Category chips solo a category rather than toggling it, which keeps their
 * "off by default, one lights up when you pick it" behaviour now that the panel
 * toggles share the same state.
 */
export const soloCategory = (
  hiddenCategoryIds: string[],
  incidentTypes: { id: string }[],
  id: string,
) =>
  isCategorySoloed(hiddenCategoryIds, incidentTypes, id)
    ? []
    : incidentTypes.filter((type) => type.id !== id).map((type) => type.id);

const PERIOD_MS: Record<Exclude<TimePeriod, "custom">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function useLivePreviewData(filters: LivePreviewFilters) {
  const reportsQuery = trpc.anonymousReports.getCombinedIncidentReports.useQuery({});
  const typesQuery = trpc.anonymousReports.getActiveIncidentTypesForMaps.useQuery();
  const orgsQuery = trpc.getPublicOrganizations.useQuery({ limit: 1 });

  // Captured once per mount rather than read live inside useMemo, so the
  // memoized filters stay pure (a "live" widget only needs this accurate to
  // within the page's lifetime, not to the millisecond).
  const now = useMemo(() => Date.now(), []);

  const allReports = useMemo(
    () => (reportsQuery.data?.success ? reportsQuery.data.data : []),
    [reportsQuery.data],
  );

  const incidentTypes = useMemo(
    () => (typesQuery.data?.success ? (typesQuery.data.data ?? []) : []),
    [typesQuery.data],
  );

  const filteredReports = useMemo(() => {
    const fromMs = filters.customRange.from
      ? new Date(filters.customRange.from).getTime()
      : undefined;
    const toMs = filters.customRange.to
      ? new Date(filters.customRange.to).getTime() + 24 * 60 * 60 * 1000
      : undefined;
    const search = filters.search.trim().toLowerCase();

    return allReports.filter((r) => {
      if (r.createdAt) {
        const t = new Date(r.createdAt).getTime();
        if (filters.timePeriod === "custom") {
          if (fromMs != null && t < fromMs) return false;
          if (toMs != null && t > toMs) return false;
        } else if (now - t > PERIOD_MS[filters.timePeriod]) {
          return false;
        }
      }

      if (r.incidentTypeId && filters.hiddenCategoryIds.includes(r.incidentTypeId)) {
        return false;
      }

      if (search) {
        const haystack = `${r.displayName ?? ""} ${r.incidentTypeDescriptions ?? ""} ${r.country ?? ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [allReports, filters, now]);

  const bubbles = useMemo<ReportBubble[]>(() => {
    const groups = new Map<
      string,
      { country: string | null; lats: number[]; lons: number[]; count: number }
    >();

    for (const r of filteredReports) {
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const key = r.country ? `country:${r.country}` : `grid:${lat.toFixed(1)},${lon.toFixed(1)}`;
      const group = groups.get(key) ?? {
        country: r.country ?? null,
        lats: [],
        lons: [],
        count: 0,
      };
      group.lats.push(lat);
      group.lons.push(lon);
      group.count += 1;
      groups.set(key, group);
    }

    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      country: group.country,
      count: group.count,
      lat: group.lats.reduce((a, b) => a + b, 0) / group.lats.length,
      lon: group.lons.reduce((a, b) => a + b, 0) / group.lons.length,
    }));
  }, [filteredReports]);

  const stats = useMemo(() => {
    const countries = new Set(allReports.map((r) => r.country).filter(Boolean));
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentReports = allReports.filter(
      (r) => r.createdAt && new Date(r.createdAt).getTime() >= oneWeekAgo,
    ).length;

    return {
      totalReports: allReports.length,
      recentReports,
      totalCountries: countries.size,
      totalDeployments: orgsQuery.data?.total ?? 0,
      totalLanguages: supportedLanguages.length,
    };
  }, [allReports, orgsQuery.data, now]);

  const topChips = useMemo<TopChip[]>(() => {
    const byCountry = new Map<string, number>();
    for (const r of allReports) {
      if (!r.country) continue;
      byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
    }
    const topCountries: TopChip[] = Array.from(byCountry.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([country, count]) => ({
        kind: "country",
        label: country,
        value: country,
        count,
      }));

    const byType = new Map<string, number>();
    for (const r of allReports) {
      if (!r.incidentTypeId) continue;
      byType.set(r.incidentTypeId, (byType.get(r.incidentTypeId) ?? 0) + 1);
    }
    const topCategories: TopChip[] = Array.from(byType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id, count]) => {
        const type = incidentTypes.find((it) => it.id === id);
        return {
          kind: "category",
          label: type?.name ?? "Incident",
          value: id,
          count,
        };
      });

    return [...topCountries, ...topCategories];
  }, [allReports, incidentTypes]);

  return {
    isLoading: reportsQuery.isLoading || typesQuery.isLoading || orgsQuery.isLoading,
    incidentTypes,
    filteredReports,
    bubbles,
    stats,
    topChips,
  };
}
