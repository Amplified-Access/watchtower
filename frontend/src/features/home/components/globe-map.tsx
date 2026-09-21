"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Locate } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReportBubble } from "../hooks/use-live-preview-data";

const DEFAULT_CENTER: [number, number] = [25, 8];
const DEFAULT_ZOOM = 1.4;
// Tightly clustered data would otherwise fit to street level, which reads as a
// bug on a world map. Cap it so the opening view still shows a region.
const FIT_MAX_ZOOM = 4.5;
// The opening move crosses most of the globe, so it gets a longer, gentler
// flight than the recenter button, which is usually a short correction.
const INITIAL_FIT_DURATION = 1800;
const RECENTER_DURATION = 900;
const HEATMAP_SOURCE_ID = "live-preview-reports";
const HEATMAP_LAYER_ID = "live-preview-reports-heat";
const CLUSTER_SOURCE_ID = "live-preview-clusters";
const CLUSTER_GLOW_LAYER_ID = "live-preview-cluster-glow";
const CLUSTER_LAYER_ID = "live-preview-clusters";
const CLUSTER_COUNT_LAYER_ID = "live-preview-cluster-count";
const POINT_GLOW_LAYER_ID = "live-preview-point-glow";
const POINT_LAYER_ID = "live-preview-point";
const BRAND_BLUE = "#0042e7";
const RING = "rgba(255,255,255,0.85)";

// Above lg, the sidebar/search/filter cards float on top of the map, so the
// visual "center" needs to be biased into the area they leave uncovered.
const DESKTOP_PADDING = { top: 120, bottom: 16, left: 320, right: 320 };
const MOBILE_PADDING = { top: 16, bottom: 16, left: 16, right: 16 };

// Docked panels sit beside the map rather than over it, so no bias is needed.
const getMapPadding = (docked: boolean) =>
  !docked && window.matchMedia("(min-width: 1024px)").matches ? DESKTOP_PADDING : MOBILE_PADDING;

// Bounds covering every marker the map can draw, so the opening view frames the
// data rather than the whole globe. Returns null when there is nothing to frame.
const getDataBounds = (bubbles: ReportBubble[], points: MapReportPoint[]) => {
  const coords = [
    ...bubbles.map((b) => [b.lon, b.lat] as [number, number]),
    ...points.map((p) => [p.lon, p.lat] as [number, number]),
  ].filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));

  if (coords.length === 0) return null;

  return coords.reduce(
    (bounds, coord) => bounds.extend(coord),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  );
};

export interface MapReportPoint {
  lat: number;
  lon: number;
  /** Shown in a popup when the report pin is clicked. */
  title?: string;
  description?: string;
  createdAt?: string;
}

// Built with textContent (never innerHTML) because report text is user-submitted.
const buildReportPopup = (point: MapReportPoint, dateLine?: string) => {
  const root = document.createElement("div");
  root.style.fontFamily = "var(--font-title)";
  const addLine = (text: string, style: Partial<CSSStyleDeclaration>) => {
    const line = document.createElement("p");
    line.textContent = text;
    Object.assign(line.style, style);
    root.appendChild(line);
  };
  if (point.title) addLine(point.title, { fontWeight: "600", color: "#000" });
  if (point.description) {
    addLine(point.description, { marginTop: "4px", color: "rgba(0,0,0,0.65)" });
  }
  if (dateLine) addLine(dateLine, { marginTop: "6px", fontSize: "11px", color: "rgba(0,0,0,0.45)" });
  return root;
};

export interface GlobeMapHandle {
  recenter: () => void;
}

interface GlobeMapProps {
  bubbles: ReportBubble[];
  points: MapReportPoint[];
  layers: {
    reports: boolean;
    clusters: boolean;
    heatmap: boolean;
    boundaries: boolean;
  };
  viewMode: "globe" | "map";
  onViewModeChange: (mode: "globe" | "map") => void;
  className?: string;
  /**
   * The live map page docks its panels beside the map and renders its own
   * controls: skip the floating-panel padding and the built-in overlay controls.
   */
  docked?: boolean;
  /**
   * For maps embedded in a scrolling page: plain scroll moves the page, and
   * zooming needs Ctrl/⌘ + scroll (two fingers to pan on touch screens).
   */
  cooperativeGestures?: boolean;
}

const GlobeMap = forwardRef<GlobeMapHandle, GlobeMapProps>(
  (
    {
      bubbles,
      points,
      layers,
      viewMode,
      onViewModeChange,
      className,
      docked = false,
      cooperativeGestures = false,
    },
    ref,
  ) => {
  const t = useTranslations("HomeLivePreview");
  const locale = useLocale();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const boundaryLayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!container || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      projection: { name: "globe" },
      attributionControl: false,
      logoPosition: "bottom-right",
      cooperativeGestures,
      locale: {
        "ScrollZoomBlocker.CtrlMessage": t("scrollZoomHint", { key: "Ctrl" }),
        "ScrollZoomBlocker.CmdMessage": t("scrollZoomHint", { key: "⌘" }),
        "TouchPanBlocker.Message": t("touchPanHint"),
      },
    });
    map.setPadding(getMapPadding(docked));

    const handleResize = () => map.setPadding(getMapPadding(docked));
    window.addEventListener("resize", handleResize);
    // Docked panels opening and closing resize the container, not the window.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    map.on("load", () => {
      map.setFog({});

      const boundaryLayer = map
        .getStyle()
        ?.layers?.find((layer) => layer.id.includes("admin") && layer.id.includes("boundary"));
      boundaryLayerIdRef.current = boundaryLayer?.id ?? null;
      if (boundaryLayerIdRef.current) {
        map.setLayoutProperty(
          boundaryLayerIdRef.current,
          "visibility",
          layers.boundaries ? "visible" : "none",
        );
      }

      map.addSource(HEATMAP_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: HEATMAP_LAYER_ID,
        type: "heatmap",
        source: HEATMAP_SOURCE_ID,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": 1,
          "heatmap-radius": 24,
          "heatmap-opacity": layers.heatmap ? 0.75 : 0,
        },
      });

      // Supercluster-backed source: groups merge as you zoom out and split as
      // you zoom in. Paint properties mirror the brand marker (blue fill, white
      // ring, soft halo) because only a GL source can cluster.
      map.addSource(CLUSTER_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });
      map.addLayer({
        id: CLUSTER_GLOW_LAYER_ID,
        type: "circle",
        source: CLUSTER_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": BRAND_BLUE,
          "circle-opacity": 0.25,
          "circle-radius": ["step", ["get", "point_count"], 21, 10, 25, 30, 30, 50, 35],
        },
      });
      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: CLUSTER_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": BRAND_BLUE,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 25, 50, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": RING,
        },
      });
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: CLUSTER_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": ["step", ["get", "point_count"], 11, 30, 14],
        },
        paint: { "text-color": "#ffffff" },
      });
      // Single reports stay unlabelled: a count of 1 is noise.
      map.addLayer({
        id: POINT_GLOW_LAYER_ID,
        type: "circle",
        source: CLUSTER_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": BRAND_BLUE, "circle-opacity": 0.25, "circle-radius": 11 },
      });
      map.addLayer({
        id: POINT_LAYER_ID,
        type: "circle",
        source: CLUSTER_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": BRAND_BLUE,
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": RING,
        },
      });

      // Clicking a cluster zooms to where it breaks apart.
      map.on("click", CLUSTER_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        if (clusterId == null) return;
        const source = map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        source?.getClusterExpansionZoom(clusterId as number, (error, zoom) => {
          if (error || zoom == null) return;
          map.easeTo({
            center: (feature!.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
            duration: 600,
          });
        });
      });
      for (const id of [CLUSTER_LAYER_ID, POINT_LAYER_ID]) {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      }

      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  // Feed the clustered source and toggle what it draws. The country-grouped
  // `bubbles` are no longer rendered: they were a fixed grouping that never
  // responded to zoom, which is what Supercluster is for. Clustering the raw
  // reports means the counts are real and break apart as you zoom in.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const source = map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [point.lon, point.lat] },
        properties: {
          title: point.title ?? "",
          description: point.description ?? "",
          createdAt: point.createdAt ?? "",
        },
      })),
    });

    const visibility = (on: boolean) => (on ? "visible" : "none");
    for (const id of [CLUSTER_GLOW_LAYER_ID, CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility(layers.clusters));
    }
    // Clustering leaves singletons and expanded children in this layer, so it
    // has to stay on whenever either toggle is.
    for (const id of [POINT_GLOW_LAYER_ID, POINT_LAYER_ID]) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visibility(layers.clusters || layers.reports));
      }
    }
  }, [points, layers.clusters, layers.reports, isLoaded]);

  // Popups for single reports, bound here so they pick up the current locale.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const handleClick = (event: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const props = feature.properties ?? {};
      const title = String(props.title ?? "");
      const description = String(props.description ?? "");
      if (!title && !description) return;

      const createdAt = String(props.createdAt ?? "");
      const dateLine = createdAt
        ? t("reportDate", {
            date: new Date(createdAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })
        : undefined;

      new mapboxgl.Popup({ offset: 10, maxWidth: "260px" })
        .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
        .setDOMContent(buildReportPopup({ lat: 0, lon: 0, title, description }, dateLine))
        .addTo(map);
    };

    map.on("click", POINT_LAYER_ID, handleClick);
    return () => {
      map.off("click", POINT_LAYER_ID, handleClick);
    };
  }, [isLoaded, locale, t]);

  // Heatmap data + visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const source = map.getSource(HEATMAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: points.map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lon, p.lat] },
          properties: {},
        })),
      });
    }

    if (map.getLayer(HEATMAP_LAYER_ID)) {
      map.setPaintProperty(HEATMAP_LAYER_ID, "heatmap-opacity", layers.heatmap ? 0.75 : 0);
    }
  }, [points, layers.heatmap, isLoaded]);

  // Country boundaries visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !boundaryLayerIdRef.current) return;
    map.setLayoutProperty(
      boundaryLayerIdRef.current,
      "visibility",
      layers.boundaries ? "visible" : "none",
    );
  }, [layers.boundaries, isLoaded]);

  // Projection follows the (parent-owned) viewMode prop, so both the
  // mobile overlay buttons and the desktop controls (rendered by the
  // parent alongside the other floating cards) stay in sync.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    map.setProjection({ name: viewMode === "globe" ? "globe" : "mercator" });
  }, [viewMode, isLoaded]);

  // flyTo rather than fitBounds so the camera arcs out and back down instead of
  // easing flatly across the globe. Deliberately not `essential`, which leaves
  // Mapbox free to skip the flight for prefers-reduced-motion users.
  const fitToData = (duration: number) => {
    const map = mapRef.current;
    if (!map) return false;
    const bounds = getDataBounds(bubbles, points);
    if (!bounds) return false;

    const padding = getMapPadding(docked);
    const camera = map.cameraForBounds(bounds, { padding });
    if (!camera?.center) {
      map.fitBounds(bounds, { padding, maxZoom: FIT_MAX_ZOOM, duration });
      return true;
    }

    map.flyTo({
      center: camera.center,
      zoom: Math.min(camera.zoom ?? FIT_MAX_ZOOM, FIT_MAX_ZOOM),
      padding,
      duration,
      curve: 1.42,
    });
    return true;
  };

  // Fly to the data once, as soon as both the style and the reports are ready.
  // Reports arrive after the map, so this has to wait for a non-empty set; the
  // ref keeps it to the opening view and stops it fighting the user's panning
  // when filters later change the marker set.
  const hasFitToDataRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || hasFitToDataRef.current) return;
    if (fitToData(INITIAL_FIT_DURATION)) hasFitToDataRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, bubbles, points]);

  const recenter = () => {
    // Falls back to the whole-globe view only when there is no data to frame.
    if (fitToData(RECENTER_DURATION)) return;
    mapRef.current?.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      padding: getMapPadding(docked),
    });
  };

  useImperativeHandle(ref, () => ({ recenter }));

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={setContainer} className="relative h-full w-full overflow-hidden" />

      {/* Below lg the map isn't covered by other cards, so it carries its own overlay controls.
          At lg+, the parent renders equivalent controls as flex siblings of the cards instead. */}
      <div
        className={`absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-black/60 p-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur lg:hidden ${docked ? "hidden" : ""}`}
      >
        <button
          type="button"
          onClick={() => onViewModeChange("globe")}
          className={`rounded-full px-3 py-1 transition-colors ${
            viewMode === "globe" ? "bg-primary text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {t("viewAsGlobe")}
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("map")}
          className={`rounded-full px-3 py-1 transition-colors ${
            viewMode === "map" ? "bg-primary text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {t("viewAsMap")}
        </button>
      </div>

      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter map"
        className={`absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/80 lg:hidden ${docked ? "hidden" : ""}`}
      >
        <Locate className="size-4" />
      </button>
    </div>
  );
  },
);

GlobeMap.displayName = "GlobeMap";

export default GlobeMap;
