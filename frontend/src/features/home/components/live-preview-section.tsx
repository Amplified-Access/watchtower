"use client";

import { useState } from "react";
import { useLivePreviewData } from "../hooks/use-live-preview-data";
import type {
  DateRange,
  TimePeriod,
  TopChip,
} from "../hooks/use-live-preview-data";
import ExploreSidebar from "./explore-sidebar";
import SearchAndChips from "./search-and-chips";
import GlobeMap from "./globe-map";
import FilterPanel from "./filter-panel";

const LivePreviewSection = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState({
    reports: false,
    clusters: true,
    heatmap: false,
    boundaries: true,
  });

  const { incidentTypes, filteredReports, bubbles, stats, topChips } =
    useLivePreviewData({ timePeriod, customRange, categoryId, search });

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
      setCategoryId((current) => (current === chip.value ? null : chip.value));
    }
  };

  const handleReset = () => {
    setTimePeriod("30d");
    setCustomRange({});
    setCategoryId(null);
    setCountry(null);
    setSearch("");
  };

  return (
    <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
        <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
        <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
      </div>
      <div className="px-4 py-16 md:px-8 md:py-24 xl:px-16">
        <div className="mx-auto max-w-360 overflow-hidden rounded-3xl bg-dark">
          <div className="flex flex-col lg:flex-row">
            <ExploreSidebar stats={stats} />

            <div className="flex min-h-[560px] flex-1 flex-col gap-4 p-5">
              <SearchAndChips
                search={search}
                onSearchChange={setSearch}
                chips={topChips}
                activeCountry={country}
                activeCategoryId={categoryId}
                onToggleChip={handleToggleChip}
              />
              <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-2xl bg-black/40">
                <GlobeMap bubbles={visibleBubbles} points={points} layers={layers} />
              </div>
            </div>

            <FilterPanel
              timePeriod={timePeriod}
              onTimePeriodChange={setTimePeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              incidentTypes={incidentTypes}
              layers={layers}
              onLayersChange={setLayers}
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
