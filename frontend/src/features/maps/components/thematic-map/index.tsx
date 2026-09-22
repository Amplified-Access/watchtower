"use client";
import Map, {
  Layer,
  Popup,
  Source,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl/mapbox";
import type {
  CircleLayerSpecification,
  GeoJSONSource,
  SymbolLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Funnel, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ThematicMapSidebar } from "./thematic-map-sidebar";
import { trpc } from "@/_trpc/client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Loader from "@/components/common/loader";
import { useQueryState } from "nuqs";
import Logo from "@/components/logo";
import { buildLiveIncidentGeoJson } from "@/features/maps/application/use-cases/build-live-incident-geojson";
import type { CombinedIncidentReport } from "@/features/maps/domain/map-report";

const BRAND_BLUE = "#0042e7";
const DARK_TEXT = "#0a0a0a";
const RING = "rgba(255,255,255,0.85)";

// Incident type colors come from the API, sometimes with stray whitespace/CRLF
// (e.g. "#00FFFF\r\n"). Mapbox rejects a malformed color outright, so anything
// that isn't a clean hex falls back to the brand blue.
const toMarkerColor = (color?: string) => {
  const trimmed = color?.trim() ?? "";
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : BRAND_BLUE;
};

// White counts disappear on light type colors such as cyan or orange, so pick
// the label color from the marker's relative luminance.
const countTextColor = (hex: string) => {
  const full =
    hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (c) => c + c) : hex;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? DARK_TEXT : "#ffffff";
};

// Markers take the incident type's color, the same one its thumbnail on the
// maps page uses. Step boundaries are shared by the cluster circle and its
// glow, so the halo always tracks the bubble it sits behind.
const buildMarkerLayers = (color: string) => {
  const clusterGlowLayer: Omit<CircleLayerSpecification, "source"> = {
    id: "cluster-glow",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": color,
      "circle-opacity": 0.25,
      "circle-radius": ["step", ["get", "point_count"], 21, 10, 25, 30, 30, 50, 35],
    },
  };

  const clusterLayer: Omit<CircleLayerSpecification, "source"> = {
    id: "clusters",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": color,
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 25, 50, 30],
      "circle-stroke-width": 2,
      "circle-stroke-color": RING,
    },
  };

  const clusterCountLayer: Omit<SymbolLayerSpecification, "source"> = {
    id: "cluster-count",
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": ["step", ["get", "point_count"], 11, 30, 14],
    },
    paint: { "text-color": countTextColor(color) },
  };

  // Single reports: same treatment, smaller, and deliberately unlabelled — a
  // count of 1 is noise.
  const pointGlowLayer: Omit<CircleLayerSpecification, "source"> = {
    id: "unclustered-glow",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-color": color, "circle-opacity": 0.25, "circle-radius": 11 },
  };

  const pointLayer: Omit<CircleLayerSpecification, "source"> = {
    id: "unclustered-point",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": color,
      "circle-radius": 7,
      "circle-stroke-width": 2,
      "circle-stroke-color": RING,
    },
  };

  return [clusterGlowLayer, clusterLayer, clusterCountLayer, pointGlowLayer, pointLayer];
};

interface PopupInfo {
  longitude: number;
  latitude: number;
  displayName: string;
  totalReports: number;
  totalInjuries: number;
  totalFatalities: number;
  incidentTypeDescriptions: string;
}

interface ThematicMapProps {
  theme: string;
  title: string;
  description: string;
  color?: string;
}

const ThematicMap = ({ theme, title, description, color }: ThematicMapProps) => {
  const markerColor = toMarkerColor(color);
  const markerLayers = useMemo(() => buildMarkerLayers(markerColor), [markerColor]);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [name] = useQueryState("country");
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
  });
  const [timeframe, setTimeframe] = useQueryState("timeframe", {
    parse: (value) => {
      if (value === "week" || value === "month" || value === "year") {
        return value;
      }
      return undefined;
    },
    serialize: (value) => value || "",
  });

  // Debounced search function for real-time search
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchInput = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setSearchTerm(value);
      }, 300); // Wait 300ms after user stops typing
    },
    [setSearchTerm],
  );

  const anonymousIncidentReports =
    trpc.anonymousReports.getCombinedIncidentReports.useQuery({
      country: name || undefined,
      category: theme, // Filter by the specific theme
      search: searchTerm || undefined,
      timeframe: timeframe || undefined,
    });

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const geojsonData = useMemo(
    () =>
      buildLiveIncidentGeoJson(
        anonymousIncidentReports.data?.data as CombinedIncidentReport[] | undefined,
      ),
    [anonymousIncidentReports.data],
  );

  // Clicking a cluster zooms to the level where Supercluster splits it, which
  // is how the group breaks apart into its members. Clicking a single report
  // opens its popup.
  const handleMapClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setPopupInfo(null);
      return;
    }

    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates as [
      number,
      number,
    ];

    if (feature.properties?.cluster) {
      const source = event.target.getSource("incidents") as GeoJSONSource | undefined;
      source?.getClusterExpansionZoom(
        feature.properties.cluster_id as number,
        (error, zoom) => {
          if (error || zoom == null) return;
          event.target.easeTo({ center: [longitude, latitude], zoom, duration: 600 });
        },
      );
      return;
    }

    const props = feature.properties ?? {};
    setPopupInfo({
      longitude,
      latitude,
      displayName: String(props.displayName ?? "Unknown Location"),
      totalReports: Number(props.totalReports) || 0,
      totalInjuries: Number(props.totalInjuries) || 0,
      totalFatalities: Number(props.totalFatalities) || 0,
      incidentTypeDescriptions: String(props.incidentTypeDescriptions ?? ""),
    });
  }, []);

  // Mapbox sizes its canvas at init, before this container has settled into its
  // full height, and then never rechecks: without this the canvas stays short
  // and leaves a strip of background under the map. Same reason the live map
  // keeps a ResizeObserver on its container.
  const mapRef = useRef<MapRef | null>(null);
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(map.getContainer());
    resizeObserverRef.current = observer;
  }, []);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const handleSubmitSearchTerm = (formData: FormData) => {
    const searchValue = formData.get("searchTerm") as string;
    setSearchTerm(searchValue);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Helper function to highlight search terms in text
  const highlightSearchTerm = (text: string, search: string) => {
    if (!search.trim()) return text;

    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-800">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <>
      {/* Pin to the viewport like the live map, so the map fills the screen
          instead of leaving a strip under it. */}
      <section className="h-dvh overflow-hidden">
        {/* h-full/min-h-0 the whole way down: SidebarProvider only sets
            min-h-svh, which is not a definite height, so the map's height:100%
            had nothing to resolve against and left a strip below it. */}
        <SidebarProvider defaultOpen={true} className="h-full min-h-0">
          <SidebarInset className="relative h-full min-h-0">
            <header className="fixed top-0 z-20 w-full shrink-0 border-b border-border bg-white">
              <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:h-19 md:px-8">
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
                {/* <div className="flex flex-col items-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h1>
                  <p className="text-sm text-gray-600 hidden md:block">
                    {description}
                  </p>
                </div> */}
                <div className="relative max-w-md w-full mr-32 hidden md:block">
                  <form action={handleSubmitSearchTerm}>
                    <Input
                      placeholder={`Search ${theme.toLowerCase()} incidents...`}
                      name="searchTerm"
                      defaultValue={searchTerm}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className={cn(
                        "mx-auto h-11 rounded-full border-0 bg-dark/5 pr-16 font-title text-dark shadow-none placeholder:text-dark/60 focus-visible:ring-0",
                        searchTerm && "bg-primary/10",
                      )}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      title="Search"
                    >
                      <Search size={16} />
                    </button>
                  </form>
                </div>
                <SidebarTrigger className="size-10 shrink-0 cursor-pointer rounded-full bg-primary text-white hover:bg-primary hover:text-white">
                  <Funnel />
                </SidebarTrigger>
              </div>
            </header>
            <Map
              ref={mapRef}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              initialViewState={{
                longitude: 36.817223,
                latitude: -1.286389,
                zoom: 5.3,
              }}
              style={{ width: "100%", height: "100%" }}
              onLoad={handleMapLoad}
              interactiveLayerIds={["clusters", "unclustered-point"]}
              onClick={handleMapClick}
              mapStyle="mapbox://styles/mapbox/outdoors-v12"
            >
              <div className="absolute top-20 -translate-x-1/2 left-1/2 max-w-86 w-full mr-32 md:hidden">
                <form action={handleSubmitSearchTerm}>
                  <Input
                    placeholder={`Search ${theme.toLowerCase()} incidents...`}
                    name="searchTerm"
                    defaultValue={searchTerm}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className={cn(
                      "mx-auto h-11 rounded-full border-0 bg-white pr-16 font-title text-dark shadow-md placeholder:text-sm placeholder:text-dark/60 focus-visible:ring-0",
                      searchTerm && "bg-primary/10",
                    )}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    title="Search"
                  >
                    <Search size={16} />
                  </button>
                </form>
              </div>
              {/* Real clustering: Mapbox groups the points with Supercluster,
                  so they merge as you zoom out and split as you zoom in. The
                  glow + ring + count styling matches the brand marker, in the type's color; it is
                  drawn with paint properties rather than DOM nodes because only
                  a GL source can cluster. */}
              <Source
                id="incidents"
                type="geojson"
                data={geojsonData}
                cluster
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                {markerLayers.map((layer) => (
                  <Layer key={layer.id} {...layer} />
                ))}
              </Source>

              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="top"
                  closeButton={false}
                  closeOnClick={false}
                  focusAfterOpen={false}
                  className="incident-popup"
                  maxWidth="320px"
                  offset={15}
                  onClose={() => setPopupInfo(null)}
                >
                  <div className="min-w-0 p-4 font-body">
                    <h3 className="mb-2 font-title text-sm font-semibold text-dark">
                      {theme} in{" "}
                      {searchTerm
                        ? highlightSearchTerm(popupInfo.displayName, searchTerm)
                        : popupInfo.displayName}
                    </h3>

                    <div className="mb-3 flex flex-wrap gap-2 text-xs text-dark/60">
                      <span className="rounded-full bg-primary/10 px-2 py-1 font-title font-medium text-primary">
                        {popupInfo.totalReports} reports
                      </span>
                      {popupInfo.totalInjuries > 0 ? (
                        <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-800">
                          {popupInfo.totalInjuries} injuries
                        </span>
                      ) : null}
                      {popupInfo.totalFatalities > 0 ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-red-800">
                          {popupInfo.totalFatalities} fatalities
                        </span>
                      ) : null}
                    </div>

                    {popupInfo.incidentTypeDescriptions && (
                      <div className="space-y-1">
                        <h4 className="mb-1 font-title text-xs font-medium text-dark/70">
                          Details:
                        </h4>
                        <div className="rounded bg-dark/5 p-2 text-xs text-dark/70">
                          {searchTerm
                            ? highlightSearchTerm(popupInfo.incidentTypeDescriptions, searchTerm)
                            : popupInfo.incidentTypeDescriptions}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 border-t border-border pt-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: markerColor }}
                        />
                        <span className="font-title text-xs font-medium text-dark/70">
                          {theme}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              )}
              {anonymousIncidentReports.isPending && (
                <div className="absolute z-10 w-full h-full backdrop-blur-sm grid place-items-center">
                  <Loader className="text-dark" size="24" />
                </div>
              )}
            </Map>
          </SidebarInset>
          <ThematicMapSidebar side="right" theme={theme} />
        </SidebarProvider>
      </section>
    </>
  );
};

export default ThematicMap;
