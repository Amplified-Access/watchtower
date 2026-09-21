"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Locate } from "lucide-react";
import {
  isCategorySoloed,
  soloCategory,
  toggleCategoryVisibility,
  useLivePreviewData,
} from "../hooks/use-live-preview-data";
import type {
  DateRange,
  TimePeriod,
  TopChip,
} from "../hooks/use-live-preview-data";
import ExploreSidebar from "./explore-sidebar";
import SearchAndChips from "./search-and-chips";
import GlobeMap, { type GlobeMapHandle } from "./globe-map";
import FilterPanel from "./filter-panel";

const LivePreviewSection = () => {
  const t = useTranslations("HomeLivePreview");
  const mapHandleRef = useRef<GlobeMapHandle>(null);
  const [viewMode, setViewMode] = useState<"globe" | "map">("globe");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
  const [country, setCountry] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // The map-layer toggles are gone from the panel, so these are fixed for now.
  const layers = { reports: false, clusters: true, heatmap: false, boundaries: true };

  const { incidentTypes, categoryIds, filteredReports, bubbles, stats, topChips } =
    useLivePreviewData({ timePeriod, customRange, hiddenCategoryIds, search });

  const soloedCategoryId =
    incidentTypes.find((type) => isCategorySoloed(hiddenCategoryIds, categoryIds, type.id))?.id ??
    null;

  const visibleReports = country
    ? filteredReports.filter((r) => r.country === country)
    : filteredReports;

  const visibleBubbles = country
    ? bubbles.filter((b) => b.country === country)
    : bubbles;

  const points = visibleReports
    .map((r) => ({ lat: Number(r.lat), lon: Number(r.lon) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  const handleToggleChip = (chip: TopChip) => {
    if (chip.kind === "country") {
      setCountry((current) => (current === chip.value ? null : chip.value));
    } else {
      setHiddenCategoryIds((current) => soloCategory(current, categoryIds, chip.value));
    }
  };

  const handleReset = () => {
    setTimePeriod("30d");
    setCustomRange({});
    setHiddenCategoryIds([]);
    setCountry(null);
    setSearch("");
  };

  return (
    <section className="relative isolate bg-dark">
      
      <div className="">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4 lg:p-4">
          {/* Map fills the exact bounds of this row (which sizes itself to the tallest card); everything else floats above it. */}
          <div className="relative h-105 w-full overflow-hidden lg:absolute lg:inset-0 lg:z-0 lg:h-full">
            <GlobeMap
              ref={mapHandleRef}
              bubbles={visibleBubbles}
              points={points}
              layers={layers}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              cooperativeGestures
              overlayControls={false}
            />
          </div>

          {/* Below lg the panels would stack under the map as a long column of
              controls, so mobile gets just the globe and a way into the full
              map instead. */}
          <div className="px-4 pb-6 md:px-8 lg:hidden [zoom:var(--viewport-scale)]">
            <Link
              href="/maps"
              className="flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 font-title font-medium text-white transition-colors hover:bg-primary/90"
            >
              {t("viewReportsCta", { count: stats.totalReports })}
            </Link>
          </div>

          <div className="relative z-10 hidden overflow-hidden rounded-2xl bg-black/70 ring-1 ring-white/10 lg:block lg:w-72 lg:shrink-0 lg:rounded-2xl lg:shadow-2xl lg:backdrop-blur-xl [zoom:var(--viewport-scale)]">
            <ExploreSidebar stats={stats} />
          </div>

          <div className="relative z-10 hidden min-w-0 lg:flex lg:flex-1 lg:flex-col lg:self-stretch lg:pointer-events-none">
            <div className="pointer-events-auto [zoom:var(--viewport-scale)]">
              <SearchAndChips
                search={search}
                onSearchChange={setSearch}
                chips={topChips}
                activeCountry={country}
                activeCategoryId={soloedCategoryId}
                onToggleChip={handleToggleChip}
              />
            </div>

            {/* Desktop-only map controls, laid out as real flex siblings of the
                cards so they scale and align with them instead of guessing pixels. */}
            <div className="pointer-events-auto mt-auto hidden items-center justify-between lg:flex [zoom:var(--viewport-scale)]">
              <div className="flex items-center gap-1 rounded-full bg-black/60 p-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setViewMode("globe")}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    viewMode === "globe" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t("viewAsGlobe")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    viewMode === "map" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t("viewAsMap")}
                </button>
              </div>
              <button
                type="button"
                onClick={() => mapHandleRef.current?.recenter()}
                aria-label="Recenter map"
                className="flex size-9 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/80"
              >
                <Locate className="size-4" />
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden overflow-hidden rounded-2xl bg-black/70 ring-1 ring-white/10 lg:block lg:w-72 lg:shrink-0 lg:self-stretch lg:overflow-y-auto lg:rounded-2xl lg:shadow-2xl lg:backdrop-blur-xl [zoom:var(--viewport-scale)]">
            <FilterPanel
              timePeriod={timePeriod}
              onTimePeriodChange={setTimePeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              incidentTypes={incidentTypes}
              hiddenCategoryIds={hiddenCategoryIds}
              onToggleCategory={(id) =>
                setHiddenCategoryIds((current) => toggleCategoryVisibility(current, id))
              }
              totalReports={stats.totalReports}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LivePreviewSection;
