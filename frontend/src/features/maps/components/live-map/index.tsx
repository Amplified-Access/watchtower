"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Layers,
  LocateFixed,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExploreSidebar from "@/features/home/components/explore-sidebar";
import FilterPanel from "@/features/home/components/filter-panel";
import GlobeMap, { type GlobeMapHandle } from "@/features/home/components/globe-map";
import {
  useLivePreviewData,
  type DateRange,
  type TimePeriod,
  type TopChip,
} from "@/features/home/hooks/use-live-preview-data";

const DEFAULT_LAYERS = { reports: true, clusters: true, heatmap: false, boundaries: true };

const panelToggleClassName =
  "flex size-8 items-center justify-center rounded-md text-dark transition-colors hover:bg-dark/5";

const floatingButtonClassName =
  "flex items-center justify-center rounded-full bg-white text-dark shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-dark/5";

// Full-screen live incident map: a top bar with search, an optional Explore
// panel on the left, the map with its floating controls, and optional filters
// on the right. Panels dock beside the map on large screens and slide over it
// on small ones.
const LiveMap = () => {
  const t = useTranslations("HomeLivePreview");
  const mapHandleRef = useRef<GlobeMapHandle>(null);

  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"globe" | "map">("globe");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const { incidentTypes, filteredReports, bubbles, stats, topChips } = useLivePreviewData({
    timePeriod,
    customRange,
    categoryId,
    search,
  });

  const visibleReports = country
    ? filteredReports.filter((r) => r.country === country)
    : filteredReports;
  const visibleBubbles = country ? bubbles.filter((b) => b.country === country) : bubbles;
  const points = visibleReports
    .map((r) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      title: r.displayName ?? undefined,
      description: r.incidentTypeDescriptions ?? undefined,
      createdAt: r.createdAt ?? undefined,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  const toggleChip = (chip: TopChip) => {
    if (chip.kind === "country") {
      setCountry((current) => (current === chip.value ? null : chip.value));
    } else {
      setCategoryId((current) => (current === chip.value ? null : chip.value));
    }
  };
  const isChipActive = (chip: TopChip) =>
    chip.kind === "country" ? country === chip.value : categoryId === chip.value;

  const resetFilters = () => {
    setTimePeriod("30d");
    setCustomRange({});
    setCategoryId(null);
    setCountry(null);
    setSearch("");
    setLayers(DEFAULT_LAYERS);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <header className="relative z-30 border-b border-border bg-white">
        <div className="flex h-16 items-center gap-4 px-4 md:h-19 md:px-8 [zoom:var(--viewport-scale)]">
          <Link href="/" aria-label="WatchTower home" className="shrink-0">
            <Image
              src="/brand/logo-black.svg"
              alt="WatchTower"
              width={219}
              height={37}
              priority
              className="h-6 w-auto md:h-8"
            />
          </Link>
          <label className="mx-auto flex h-11 w-full max-w-xl items-center gap-3 rounded-full bg-dark/5 px-5">
            <Search className="size-5 shrink-0 text-dark" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full bg-transparent font-title text-dark placeholder:text-dark/80 focus:outline-none md:text-lg"
            />
          </label>
          <span aria-hidden className="hidden w-32 shrink-0 md:block" />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Explore panel */}
        <aside
          id="live-map-explore"
          hidden={!isExploreOpen}
          className="absolute inset-y-0 left-0 z-20 w-full max-w-sm overflow-y-auto border-r border-border bg-white shadow-xl lg:static lg:w-[26rem] lg:max-w-none lg:shrink-0 lg:shadow-none"
        >
          <div className="h-full [zoom:var(--viewport-scale)]">
            <ExploreSidebar
              stats={stats}
              variant="light"
              headerAction={
                <button
                  type="button"
                  onClick={() => setIsExploreOpen(false)}
                  aria-label={t("hideExplore")}
                  aria-controls="live-map-explore"
                  aria-expanded
                  className={panelToggleClassName}
                >
                  <PanelLeftClose className="size-5" />
                </button>
              }
            />
          </div>
        </aside>

        {/* Map and floating controls */}
        <div className="relative min-w-0 flex-1">
          <GlobeMap
            ref={mapHandleRef}
            bubbles={visibleBubbles}
            points={points}
            layers={layers}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            docked
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4 [zoom:var(--viewport-scale)]">
            <div className="flex items-start gap-3">
              {!isExploreOpen && (
                <button
                  type="button"
                  onClick={() => setIsExploreOpen(true)}
                  aria-label={t("showExplore")}
                  aria-controls="live-map-explore"
                  aria-expanded={false}
                  className={cn(panelToggleClassName, "pointer-events-auto bg-white shadow-md")}
                >
                  <PanelLeftOpen className="size-5" />
                </button>
              )}
              <div className="pointer-events-auto flex min-w-0 flex-1 flex-wrap gap-2 md:gap-4">
                {topChips.map((chip) => (
                  <button
                    key={`${chip.kind}-${chip.value}`}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    aria-pressed={isChipActive(chip)}
                    className={cn(
                      "rounded-full border px-3 py-1 font-title text-sm shadow-sm transition-colors md:px-4 md:py-1.5 md:text-lg",
                      isChipActive(chip)
                        ? "border-primary bg-primary text-white"
                        : "border-dark/5 bg-white text-dark hover:bg-dark/5",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="pointer-events-auto flex flex-col items-center gap-3">
                {!isFiltersOpen && (
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(true)}
                    aria-label={t("showFilters")}
                    aria-controls="live-map-filters"
                    aria-expanded={false}
                    className={cn(panelToggleClassName, "bg-white shadow-md")}
                  >
                    <PanelRightOpen className="size-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((open) => !open)}
                  aria-label={t("mapLayersButton")}
                  aria-controls="live-map-filters"
                  aria-expanded={isFiltersOpen}
                  className={cn(floatingButtonClassName, "size-12 md:size-14")}
                >
                  <Layers className="size-6" />
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="pointer-events-auto rounded-md bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                <p className="px-1 font-title text-xs font-medium uppercase tracking-wide text-dark">
                  {t("viewAsHeading")}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t("viewAsHeading")}
                  className="mt-2 flex rounded-full border border-dark/10 bg-dark/2 p-0.5"
                >
                  {(["globe", "map"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={viewMode === mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "rounded-full px-3 py-1 font-title text-sm transition-colors md:text-lg",
                        viewMode === mode ? "bg-primary text-white" : "text-dark/40 hover:text-dark",
                      )}
                    >
                      {mode === "globe" ? t("viewAsGlobe") : t("viewAsMap")}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => mapHandleRef.current?.recenter()}
                aria-label={t("recenterMap")}
                className={cn(floatingButtonClassName, "pointer-events-auto size-14 md:size-20")}
              >
                <LocateFixed className="size-7 stroke-[1.5] md:size-9" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        <aside
          id="live-map-filters"
          hidden={!isFiltersOpen}
          className="absolute inset-y-0 right-0 z-20 w-full max-w-sm overflow-y-auto border-l border-border bg-white shadow-xl lg:static lg:w-[23rem] lg:max-w-none lg:shrink-0 lg:shadow-none"
        >
          <div className="min-h-full [zoom:var(--viewport-scale)]">
            <FilterPanel
              variant="light"
              timePeriod={timePeriod}
              onTimePeriodChange={setTimePeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              incidentTypes={incidentTypes}
              layers={layers}
              onLayersChange={setLayers}
              totalReports={visibleReports.length}
              onReset={resetFilters}
              onViewReports={() => setIsFiltersOpen(false)}
              headerAction={
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label={t("hideFilters")}
                  aria-controls="live-map-filters"
                  aria-expanded
                  className={panelToggleClassName}
                >
                  <PanelRightClose className="size-5" />
                </button>
              }
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LiveMap;
