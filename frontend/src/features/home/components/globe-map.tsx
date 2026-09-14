"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Locate } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReportBubble } from "../hooks/use-live-preview-data";

const DEFAULT_CENTER: [number, number] = [25, 8];
const DEFAULT_ZOOM = 1.4;
const HEATMAP_SOURCE_ID = "live-preview-reports";
const HEATMAP_LAYER_ID = "live-preview-reports-heat";

interface GlobeMapProps {
  bubbles: ReportBubble[];
  points: { lat: number; lon: number }[];
  layers: {
    reports: boolean;
    clusters: boolean;
    heatmap: boolean;
    boundaries: boolean;
  };
  className?: string;
}

const GlobeMap = ({ bubbles, points, layers, className }: GlobeMapProps) => {
  const t = useTranslations("HomeLivePreview");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"globe" | "map">("globe");
  const boundaryLayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!container || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/dark-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      projection: { name: "globe" },
      attributionControl: false,
      logoPosition: "bottom-right",
    });

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

        const marker = new mapboxgl.Marker(el)
          .setLngLat([point.lon, point.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    }
  }, [bubbles, points, layers.clusters, layers.reports, isLoaded]);

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

  const toggleProjection = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = viewMode === "globe" ? "map" : "globe";
    map.setProjection({ name: next === "globe" ? "globe" : "mercator" });
    setViewMode(next);
  };

  const recenter = () => {
    mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  };

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div
        ref={setContainer}
        className="relative h-full w-full overflow-hidden rounded-2xl"
      />

      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-black/60 p-1 text-xs font-medium text-white backdrop-blur">
        <span className="px-2 text-white/50">{t("viewAsLabel")}</span>
        <button
          type="button"
          onClick={() => viewMode !== "globe" && toggleProjection()}
          className={`rounded-full px-3 py-1 transition-colors ${
            viewMode === "globe" ? "bg-primary text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {t("viewAsGlobe")}
        </button>
        <button
          type="button"
          onClick={() => viewMode !== "map" && toggleProjection()}
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
        aria-label={t("viewAsLabel")}
        className="absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
      >
        <Locate className="size-4" />
      </button>
    </div>
  );
};

export default GlobeMap;
