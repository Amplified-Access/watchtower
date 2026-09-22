"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/_trpc/client";
import { languages as supportedLanguages } from "@/components/common/language-selector";
import type { MapFeatureCollection, MapFilter } from "@/lib/api/map";

export type TimePeriod = "24h" | "7d" | "30d" | "custom";

export interface DateRange {
  from?: string;
  to?: string;
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
  country: string | null;
}

/** Flip one category's toggle. */
export const toggleCategoryVisibility = (hiddenCategoryIds: string[], id: string) =>
  hiddenCategoryIds.includes(id)
    ? hiddenCategoryIds.filter((hidden) => hidden !== id)
    : [...hiddenCategoryIds, id];

/** True when `id` is the only category left visible. */
export const isCategorySoloed = (
  hiddenCategoryIds: string[],
  categoryIds: string[],
  id: string,
) =>
  categoryIds.length > 1 &&
  !hiddenCategoryIds.includes(id) &&
  categoryIds.every((categoryId) => categoryId === id || hiddenCategoryIds.includes(categoryId));

/**
 * Category chips solo a category rather than toggling it, which keeps their
 * "off by default, one lights up when you pick it" behaviour now that the panel
 * toggles share the same state.
 */
export const soloCategory = (
  hiddenCategoryIds: string[],
  categoryIds: string[],
  id: string,
) =>
  isCategorySoloed(hiddenCategoryIds, categoryIds, id)
    ? []
    : categoryIds.filter((categoryId) => categoryId !== id);

// Search waits until typing pauses, so the backend isn't queried per keystroke.
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_POINTS: MapFeatureCollection = { type: "FeatureCollection", features: [] };

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
};

// The map's data comes from the Go backend's /map endpoints, already filtered,
// counted and shaped as GeoJSON; this hook only turns the panel's state into
// query parameters. Two requests: the unfiltered summary, for the headline
// stats, country list and top chips (so they don't shift as filters change),
// and the filtered points the map draws.
export function useLivePreviewData(filters: LivePreviewFilters) {
  const typesQuery = trpc.anonymousReports.getActiveIncidentTypesForMaps.useQuery();
  const orgsQuery = trpc.getPublicOrganizations.useQuery({ limit: 1 });
  const summaryQuery = trpc.map.summary.useQuery({});

  const search = useDebouncedValue(filters.search.trim(), SEARCH_DEBOUNCE_MS);
  const pointsFilter: MapFilter = {
    excludeTypes: filters.hiddenCategoryIds.length ? [...filters.hiddenCategoryIds].sort() : undefined,
    country: filters.country ?? undefined,
    q: search || undefined,
    ...(filters.timePeriod === "custom"
      ? { from: filters.customRange.from || undefined, to: filters.customRange.to || undefined }
      : { period: filters.timePeriod }),
  };
  // Previous points stay on the map while a new filter loads, rather than
  // the markers blinking out.
  const pointsQuery = trpc.map.points.useQuery(pointsFilter, { placeholderData: keepPreviousData });

  const incidentTypes = useMemo(
    () => (typesQuery.data?.success ? (typesQuery.data.data ?? []) : []),
    [typesQuery.data],
  );
  const summary = summaryQuery.data;

  const stats = {
    totalReports: summary?.totalReports ?? 0,
    recentReports: summary?.recentReports ?? 0,
    totalCountries: summary?.countries.length ?? 0,
    totalDeployments: orgsQuery.data?.total ?? 0,
    totalLanguages: supportedLanguages.length,
  };

  const categoryIds = useMemo(() => {
    const ids = new Set(incidentTypes.map((type) => type.id));
    for (const type of summary?.types ?? []) ids.add(type.id);
    return Array.from(ids);
  }, [incidentTypes, summary]);

  // Every country with reports, for the filters panel.
  const countries = useMemo(
    () => (summary?.countries ?? []).map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [summary],
  );

  // The backend sorts countries and types by count, so the chips are the top two of each.
  const topChips = useMemo<TopChip[]>(() => {
    if (!summary) return [];
    const topCountries: TopChip[] = summary.countries.slice(0, 2).map((c) => ({
      kind: "country",
      label: c.name,
      value: c.name,
      count: c.count,
    }));
    const topCategories: TopChip[] = summary.types.slice(0, 2).map((type) => ({
      kind: "category",
      label: incidentTypes.find((it) => it.id === type.id)?.name ?? type.name,
      value: type.id,
      count: type.count,
    }));
    return [...topCountries, ...topCategories];
  }, [summary, incidentTypes]);

  return {
    isLoading: pointsQuery.isLoading || typesQuery.isLoading || summaryQuery.isLoading,
    incidentTypes,
    categoryIds,
    countries,
    points: pointsQuery.data ?? EMPTY_POINTS,
    /** False while the map still shows the previous filter's points. */
    pointsAreCurrent: pointsQuery.isSuccess && !pointsQuery.isPlaceholderData,
    stats,
    topChips,
  };
}
