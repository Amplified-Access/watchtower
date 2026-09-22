"use client";
import Map, {
  Layer,
  Popup,
  Source,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl/mapbox";
import mapboxgl, {
  type CircleLayerSpecification,
  type GeoJSONSource,
  type SymbolLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed, PanelRightClose, PanelRightOpen, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThematicMapFilterPanel } from "./thematic-map-sidebar";
import { trpc } from "@/_trpc/client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Loader from "@/components/common/loader";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { buildLiveIncidentGeoJson } from "@/features/maps/application/use-cases/build-live-incident-geojson";
import type {
  CombinedIncidentReport,
  GeoIncidentFeatureCollection,
} from "@/features/maps/domain/map-report";

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

// The camera opens on the whole globe and flies to the reports once they load,
// the same opening as the live incident map (see GlobeMap). Reports come from
// well beyond East Africa, so a fixed regional view would leave some off-screen.
const DEFAULT_VIEW = { longitude: 25, latitude: 8, zoom: 1.4 };
// Tightly clustered data would otherwise fit to street level.
const FIT_MAX_ZOOM = 5;
const FIT_PADDING = 48;
const INITIAL_FIT_DURATION = 1800;
const RECENTER_DURATION = 900;

const TIMEFRAMES = ["week", "month", "year"] as const;

const panelToggleClassName =
  "flex size-8 items-center justify-center rounded-md text-dark transition-colors hover:bg-dark/5";

const floatingButtonClassName =
  "flex cursor-pointer items-center justify-center rounded-full bg-white text-dark shadow-[0_4px_16px_rgba(0,0,0,0.15)]";

const getDataBounds = (data: GeoIncidentFeatureCollection) => {
  const coords = data.features.map((f) => f.geometry.coordinates);
  if (coords.length === 0) return null;
  return coords.reduce(
    (bounds, coord) => bounds.extend(coord),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  );
};

// Full-screen map for one incident type. Its chrome copies the live incident
// map: a top bar with search, a filters panel on the right that collapses to a
// rail on large screens and slides over the map on small ones, a Globe/Map
// switch and a recenter button. Filters stay in the URL so a view can be shared.
const ThematicMap = ({ theme, color }: ThematicMapProps) => {
  const t = useTranslations("HomeLivePreview");
  const markerColor = toMarkerColor(color);
  const markerLayers = useMemo(() => buildMarkerLayers(markerColor), [markerColor]);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"globe" | "map">("globe");
  const [country, setCountry] = useQueryState("country");
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
  });
  const [timeframe, setTimeframe] = useQueryState(
    "timeframe",
    parseAsStringLiteral(TIMEFRAMES),
  );

  // The input updates immediately; the URL (and so the query) follows 300ms
  // after typing stops.
  const [searchInput, setSearchInput] = useState(searchTerm);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => setSearchTerm(value), 300);
  };
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const anonymousIncidentReports =
    trpc.anonymousReports.getCombinedIncidentReports.useQuery({
      country: country || undefined,
      category: theme, // Filter by the specific theme
      search: searchTerm || undefined,
      timeframe: timeframe || undefined,
    });

  // Country chips come from every country this theme has reports in, not the
  // country-filtered result, so picking one doesn't empty the list.
  const countryOptionsQuery =
    trpc.anonymousReports.getCombinedIncidentReports.useQuery({
      category: theme,
      timeframe: timeframe || undefined,
    });
  const countries = useMemo(() => {
    const names = new Set<string>();
    for (const report of countryOptionsQuery.data?.data ?? []) {
      if (report.country) names.add(report.country);
    }
    if (country) names.add(country);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [countryOptionsQuery.data, country]);

  const geojsonData = useMemo(
    () =>
      buildLiveIncidentGeoJson(
        anonymousIncidentReports.data?.data as CombinedIncidentReport[] | undefined,
      ),
    [anonymousIncidentReports.data],
  );
  const totalReports = geojsonData.features.reduce(
    (sum, feature) => sum + feature.properties.totalReports,
    0,
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

  // Mapbox sizes its canvas at init and doesn't recheck on its own; the
  // ResizeObserver also covers the filters panel docking and undocking, which
  // resizes the container but not the window.
  const mapRef = useRef<MapRef | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(map.getContainer());
    resizeObserverRef.current = observer;
    setIsMapLoaded(true);
  }, []);
  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  // flyTo rather than fitBounds so the camera arcs out and back down, as on
  // the live map. Not `essential`, so reduced-motion users skip the flight.
  const fitToData = useCallback(
    (duration: number) => {
      const map = mapRef.current;
      const bounds = getDataBounds(geojsonData);
      if (!map || !bounds) return false;
      const camera = map.cameraForBounds(bounds, { padding: FIT_PADDING });
      if (!camera?.center) {
        map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration });
        return true;
      }
      map.flyTo({
        center: camera.center,
        zoom: Math.min(camera.zoom ?? FIT_MAX_ZOOM, FIT_MAX_ZOOM),
        duration,
        curve: 1.42,
      });
      return true;
    },
    [geojsonData],
  );

  // Fit once when the reports first arrive, and again whenever the country
  // filter changes, since that moves the data somewhere else entirely. Search
  // and time period only thin the markers out, so they leave the camera alone
  // rather than flying around while someone types.
  const fittedCountryRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!isMapLoaded || fittedCountryRef.current === country) return;
    if (anonymousIncidentReports.isFetching) return;
    if (fitToData(INITIAL_FIT_DURATION)) fittedCountryRef.current = country;
  }, [isMapLoaded, country, fitToData, anonymousIncidentReports.isFetching]);

  const recenter = () => {
    if (fitToData(RECENTER_DURATION)) return;
    mapRef.current?.flyTo({ ...DEFAULT_VIEW, center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude] });
  };

  const resetFilters = () => {
    setCountry(null);
    setTimeframe(null);
    setSearchTerm(null);
    setSearchInput("");
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

  const searchPlaceholder = `Search ${theme.toLowerCase()} incidents...`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <header className="relative z-30 border-b border-border bg-white">
        <div className="flex h-16 items-center gap-4 px-4 md:h-19 md:px-8">
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
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent font-title text-dark placeholder:text-dark/80 focus:outline-none md:text-lg"
            />
          </label>
          <span aria-hidden className="hidden w-32 shrink-0 md:block" />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Map and floating controls */}
        <div className="relative min-w-0 flex-1">
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={DEFAULT_VIEW}
            projection={viewMode === "globe" ? "globe" : "mercator"}
            fog={{}}
            style={{ width: "100%", height: "100%" }}
            onLoad={handleMapLoad}
            interactiveLayerIds={["clusters", "unclustered-point"]}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            attributionControl={false}
            logoPosition="bottom-right"
          >
            {/* Real clustering: Mapbox groups the points with Supercluster,
                so they merge as you zoom out and split as you zoom in. The
                glow + ring + count styling matches the brand marker, in the
                type's color; it is drawn with paint properties rather than DOM
                nodes because only a GL source can cluster. */}
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
          </Map>

          {anonymousIncidentReports.isPending && (
            <div className="absolute inset-0 z-10 grid place-items-center backdrop-blur-sm">
              <Loader className="text-dark" size="24" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
            <div className="flex items-start justify-end gap-3">
              {!isFiltersOpen && (
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(true)}
                  aria-label={t("showFilters")}
                  aria-controls="thematic-map-filters"
                  aria-expanded={false}
                  className={cn(panelToggleClassName, "pointer-events-auto bg-white shadow-md lg:hidden")}
                >
                  <PanelRightOpen className="size-5" />
                </button>
              )}
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
                onClick={recenter}
                aria-label={t("recenterMap")}
                className={cn(floatingButtonClassName, "pointer-events-auto size-12 md:size-14")}
              >
                <LocateFixed className="size-6 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed, the panel becomes a rail rather than vanishing, as on the
            live map. Below lg it overlays the map, so the floating toggle
            above applies there instead. */}
        {!isFiltersOpen && (
          <div className="hidden w-12 shrink-0 flex-col items-center border-l border-border bg-white pt-3 lg:flex">
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              aria-label={t("showFilters")}
              aria-controls="thematic-map-filters"
              aria-expanded={false}
              className={panelToggleClassName}
            >
              <PanelRightOpen className="size-5" />
            </button>
          </div>
        )}

        <aside
          id="thematic-map-filters"
          hidden={!isFiltersOpen}
          className="absolute inset-y-0 right-0 z-20 w-full max-w-sm overflow-y-auto border-l border-border bg-white shadow-xl lg:static lg:w-[23rem] lg:max-w-none lg:shrink-0 lg:shadow-none"
        >
          <ThematicMapFilterPanel
            theme={theme}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            countries={countries}
            country={country}
            onCountryChange={setCountry}
            totalReports={totalReports}
            onReset={resetFilters}
            onViewReports={() => setIsFiltersOpen(false)}
            headerAction={
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                aria-label={t("hideFilters")}
                aria-controls="thematic-map-filters"
                aria-expanded
                className={panelToggleClassName}
              >
                <PanelRightClose className="size-5" />
              </button>
            }
          />
        </aside>
      </div>
    </div>
  );
};

export default ThematicMap;
