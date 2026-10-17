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
// side, so a phone's small frame doesn't zoom out to the whole world. In a
// frame that fades out at the bottom (the About page's, from 55% down),
// `bottom` (a share of its height) keeps the data in the top 70%, where the
// fade has barely begun, so no cluster fades out; clearing the whole fade
// would zoom out to most of the world. Left out, the bottom margin is the
// same as the others.
const MARGIN = 0.15;

// Used by the home page's How it works (step 2) and the About page's steps.
// With `sphere`, the globe view instead, as a ball filling the (square)
// frame and turned to face the data (GlobeMap's `sphere`): no margin.
const LiveMapPreview = ({ bottom, sphere = false }: { bottom?: number; sphere?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [padding, setPadding] = useState<{ top: number; bottom: number; left: number; right: number } | null>(null);
  const { points } = useLivePreviewData(FILTERS);

  // Measured before the map is created, so its first framing uses it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = Math.round(Math.min(width, height) * MARGIN);
    setPadding({ top: margin, left: margin, right: margin, bottom: bottom === undefined ? margin : Math.round(height * bottom) });
  }, [bottom]);

  return (
    <div ref={ref} className="h-full w-full">
      {padding !== null && (
        <GlobeMap
          points={points}
          layers={LAYERS}
          viewMode={sphere ? "globe" : "map"}
          onViewModeChange={noop}
          docked
          overlayControls={false}
          interactive={false}
          padding={sphere ? undefined : padding}
          sphere={sphere}
        />
      )}
    </div>
  );
};

export default LiveMapPreview;
