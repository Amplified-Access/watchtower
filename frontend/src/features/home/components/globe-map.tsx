"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Locate } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReportBubble } from "../hooks/use-live-preview-data";

const DEFAULT_CENTER: [number, number] = [25, 8];
const DEFAULT_ZOOM = 1.4;
const HEATMAP_SOURCE_ID = "live-preview-reports";
const HEATMAP_LAYER_ID = "live-preview-reports-heat";

// Above lg, the sidebar/search/filter cards float on top of the map, so the
// visual "center" needs to be biased into the area they leave uncovered.
const DESKTOP_PADDING = { top: 120, bottom: 16, left: 320, right: 320 };
const MOBILE_PADDING = { top: 16, bottom: 16, left: 16, right: 16 };

// Docked panels sit beside the map rather than over it, so no bias is needed.
const getMapPadding = (docked: boolean) =>
  !docked && window.matchMedia("(min-width: 1024px)").matches ? DESKTOP_PADDING : MOBILE_PADDING;

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
}

const GlobeMap = forwardRef<GlobeMapHandle, GlobeMapProps>(
  ({ bubbles, points, layers, viewMode, onViewModeChange, className, docked = false }, ref) => {
  const t = useTranslations("HomeLivePreview");
  const locale = useLocale();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
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

      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  // Markers: country bubbles (clusters) + individual report pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (layers.clusters) {
      for (const bubble of bubbles) {
        const size = Math.max(28, Math.min(56, 24 + Math.log(bubble.count + 1) * 10));
        const el = document.createElement("div");
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.backgroundColor = "var(--primary)";
        el.style.border = "2px solid rgba(255,255,255,0.85)";
        el.style.boxShadow = "0 0 0 4px rgba(0,66,231,0.25)";
        el.style.color = "#fff";
        el.style.fontWeight = "600";
        el.style.fontSize = size > 40 ? "14px" : "11px";
        el.textContent = String(bubble.count);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([bubble.lon, bubble.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    }

    if (layers.reports) {
      for (const point of points) {
        const el = document.createElement("div");
        el.style.width = "6px";
        el.style.height = "6px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#fff";
        el.style.border = "1px solid var(--primary)";
        el.style.opacity = "0.85";

        const marker = new mapboxgl.Marker(el).setLngLat([point.lon, point.lat]);
        if (point.title || point.description) {
          el.style.cursor = "pointer";
          const dateLine = point.createdAt
            ? t("reportDate", {
                date: new Date(point.createdAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              })
            : undefined;
          marker.setPopup(
            new mapboxgl.Popup({ offset: 10, maxWidth: "260px" }).setDOMContent(
              buildReportPopup(point, dateLine),
            ),
          );
        }
        marker.addTo(map);
        markersRef.current.push(marker);
      }
    }
  }, [bubbles, points, layers.clusters, layers.reports, isLoaded, locale, t]);

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

  const recenter = () => {
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
