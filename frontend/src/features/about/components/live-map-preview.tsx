"use client";

import { useEffect, useRef, useState } from "react";
import GlobeMap from "@/features/home/components/globe-map";
import { useLivePreviewData, type TimePeriod } from "@/features/home/hooks/use-live-preview-data";

// The live incident map as a picture: the same data and layers as
// /maps/live-incident-map, in its flat "Map" view rather than the globe
// (its last 30 days, every incident type), with no header, sidebars or
// controls, and no interaction. It frames the data once loaded, as the live
// map does, with room around the clusters so none sits on the frame's edge.

// As the live map's defaults (features/maps/components/live-map). Module
// constants, so the data query's inputs stay stable between renders.
const LAYERS = { reports: true, clusters: true, heatmap: false, boundaries: true };
const FILTERS = {
  timePeriod: "30d" as TimePeriod,
  customRange: {},
  hiddenCategoryIds: [] as string[],
  search: "",
  country: null,
};
const noop = () => {};

// The margin kept clear around the data: a share of the frame's shorter
// side, so a phone's small frame doesn't zoom out to the whole world.
const MARGIN = 0.15;

const LiveMapPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [padding, setPadding] = useState<number | null>(null);
  const { points } = useLivePreviewData(FILTERS);

  // Measured before the map is created, so its first framing uses it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPadding(Math.round(Math.min(width, height) * MARGIN));
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {padding !== null && (
        <GlobeMap
          points={points}
          layers={LAYERS}
          viewMode="map"
          onViewModeChange={noop}
          docked
          overlayControls={false}
          interactive={false}
          padding={padding}
        />
      )}
    </div>
  );
};

export default LiveMapPreview;
