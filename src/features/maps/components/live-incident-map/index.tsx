"use client";
import Map, {
  Source,
  Layer,
  Popup,
  ViewState,
  MapMouseEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Funnel, Search, X } from "lucide-react";
import type { CircleLayer, SymbolLayer } from "mapbox-gl";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { AppSidebar } from "./map-side-bar";
import { trpc } from "@/_trpc/client";
import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import Loader from "@/components/common/loader";
import { useQueryState } from "nuqs";
import Logo from "@/components/logo";

const LiveIncidentMap = () => {
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    properties: any;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: 52.5, // Center between East Africa and Pakistan
    latitude: 13, // Center between East Africa (lat ~0) and Pakistan (lat ~29)
    zoom: 3.5, // Lower zoom to show both regions
  });
  const [name] = useQueryState("country");
  const [selectedCategory] = useQueryState("category");
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

  // Debug logging to see what's happening with the filters
  useEffect(() => {
    console.log("🔍 Live Map Filter State:", {
      country: name,
      category: selectedCategory,
      search: searchTerm,
      timeframe,
    });
  }, [name, selectedCategory, searchTerm, timeframe]);

  const anonymousIncidentReports =
    trpc.anonymousReports.getCombinedIncidentReports.useQuery(
      {
        country: name || undefined,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        timeframe: timeframe || undefined,
      },
      {
        refetchOnMount: true,
        staleTime: 0, // Don't use cached data
      },
    );

  // Convert incident reports to GeoJSON format
  const geojsonData = useMemo(() => {
    if (!anonymousIncidentReports.data?.data) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    const features = anonymousIncidentReports.data.data
      .filter((report) => report.lat && report.lon)
      .map((report) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [Number(report.lon), Number(report.lat)],
        },
        properties: {
          totalReports: Number(report.totalReports) || 1,
          totalInjuries: Number(report.totalInjuries) || 0,
          totalFatalities: Number(report.totalFatalities) || 0,
          displayName: String(report.displayName || "Unknown Location"),
          incidentTypeDescriptions: String(
            report.incidentTypeDescriptions || "",
          ),
        },
      }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [anonymousIncidentReports.data]);

  // Cluster layer - shows grouped incidents as circles
  const clusterLayer: CircleLayer = {
    id: "clusters",
    type: "circle",
    source: "incidents",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#fca5a5",
        10,
        "#f87171",
        30,
        "#ef4444",
        50,
        "#dc2626",
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        15,
        10,
        20,
        30,
        25,
        50,
        30,
      ],
      "circle-opacity": 0.8,
    },
  };

  // Cluster count label
  const clusterCountLayer: SymbolLayer = {
    id: "cluster-count",
    type: "symbol",
    source: "incidents",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  };

  // Unclustered point layer - individual incidents (matching thematic map style)
  const unclusteredPointLayer: CircleLayer = {
    id: "unclustered-point",
    type: "circle",
    source: "incidents",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "totalReports"],
        1,
        4.5, // 1 report: small dot
        5,
        6.5, // 5 reports: medium dot
        8,
        8, // 8+ reports: max size
      ],
      "circle-color": "#ef4444",
      "circle-opacity": 0.9,
      "circle-stroke-width": 0,
    },
  };

  // Glow layer for unclustered points
  const unclusteredGlowLayer: CircleLayer = {
    id: "unclustered-glow",
    type: "circle",
    source: "incidents",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "totalReports"],
        1,
        13.5, // 1 report: small glow
        5,
        19.5, // 5 reports: medium glow
        8,
        24, // 8+ reports: max glow
      ],
      "circle-color": "#ef4444",
      "circle-opacity": 0.2,
      "circle-blur": 0.5,
    },
  };

  // Debug data response
  useEffect(() => {
    if (anonymousIncidentReports.data) {
      console.log("📊 Live Map Data Response:", {
        dataLength: anonymousIncidentReports.data?.data?.length,
        geoJsonFeatures: geojsonData.features.length,
      });
    }
  }, [anonymousIncidentReports.data, geojsonData]);

  // Auto-fit map to show all markers
  useEffect(() => {
    const reports = anonymousIncidentReports.data?.data;
    if (reports && reports.length > 0) {
      // Calculate bounds of all markers
      const lngs = reports.map((r) => Number(r.lon)).filter((n) => !isNaN(n));
      const lats = reports.map((r) => Number(r.lat)).filter((n) => !isNaN(n));

      if (lngs.length > 0 && lats.length > 0) {
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        // Calculate center
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;

        // Calculate appropriate zoom level based on bounds
        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);

        let zoom = 5; // Default for multiple countries
        if (maxDiff < 0.5)
          zoom = 10; // City/region
        else if (maxDiff < 2)
          zoom = 8; // Large region
        else if (maxDiff < 5)
          zoom = 6; // Country
        else if (maxDiff < 15)
          zoom = 4; // Multiple countries
        else if (maxDiff < 40)
          zoom = 3; // Continent
        else zoom = 2; // Multi-continent

        // Animate to new viewport
        setViewState({
          longitude: centerLng,
          latitude: centerLat,
          zoom: zoom,
        });
      }
    }
  }, [anonymousIncidentReports.data]);

  // Handle map click - zoom into clusters or show popup for individual points
  const onMapClick = useCallback((event: MapMouseEvent) => {
    const features = event.features;
    if (features && features.length > 0) {
      const feature = features[0];

      // If it's a cluster, zoom in
      if (feature.properties?.cluster) {
        const clusterId = feature.properties.cluster_id;
        const mapboxSource = event.target.getSource("incidents") as any;

        mapboxSource.getClusterExpansionZoom(
          clusterId,
          (err: any, zoom: number) => {
            if (err) return;

            setViewState({
              longitude: (feature.geometry as any).coordinates[0],
              latitude: (feature.geometry as any).coordinates[1],
              zoom: zoom,
            });
          },
        );
      } else {
        // If it's an individual point, show popup
        setPopupInfo({
          longitude: (feature.geometry as any).coordinates[0],
          latitude: (feature.geometry as any).coordinates[1],
          properties: feature.properties,
        });
      }
    }
  }, []);

  // Handle hover
  const onMouseEnter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "pointer";
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
      <section>
        <SidebarProvider defaultOpen={true}>
          <SidebarInset>
            <header className="fixed w-full bg-background top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-3 w-full border-0 justify-between">
                <Link
                  href={"/"}
                  className="flex gap-2 items-center text-2xl font-semibold font-title"
                >
                  <Logo color={"white"} />
                </Link>
                <div className="relative max-w-md w-full mr-32 hidden md:block">
                  <form action={handleSubmitSearchTerm}>
                    <Input
                      placeholder="Search locations, incidents, descriptions..."
                      name="searchTerm"
                      defaultValue={searchTerm}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className={`rounded-full shadow-none bg-white mx-auto pr-16 ${
                        searchTerm ? "ring-2 ring-blue-500/20 bg-blue-50" : ""
                      }`}
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
                  {/* Search indicator */}
                  {/* {searchTerm && (
                    <div className="absolute -bottom-6 left-0 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Searching: "{searchTerm}"
                    </div>
                  )} */}
                </div>
                <SidebarTrigger className="bg-primary text-white mr-2 hover:bg-primary hover:text-white">
                  <Funnel />
                </SidebarTrigger>
              </div>
            </header>
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v9"
              interactiveLayerIds={["clusters", "unclustered-point"]}
              onClick={onMapClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              cursor={hoveredFeature ? "pointer" : "grab"}
            >
              <div className="w-full max-w-86 md:hidden absolute top-20 translate-x-1/2 right-1/2">
                <form action={handleSubmitSearchTerm} className="relative">
                  <Input
                    placeholder="Search locations, incidents, descriptions..."
                    name="searchTerm"
                    defaultValue={searchTerm}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className={`rounded-full shadow-none bg-white mx-auto pr-16 placeholder:text-sm ${
                      searchTerm ? "ring-2 ring-blue-500/20 bg-blue-50" : ""
                    }`}
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

              {/* GeoJSON Source with Clustering */}
              <Source
                id="incidents"
                type="geojson"
                data={geojsonData}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                <Layer {...clusterLayer} />
                <Layer {...clusterCountLayer} />
                <Layer {...unclusteredGlowLayer} />
                <Layer {...unclusteredPointLayer} />
              </Source>

              {/* Popup for clicked incident */}
              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="top"
                  onClose={() => setPopupInfo(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="incident-popup"
                  maxWidth="280px"
                  offset={15}
                >
                  <div className="p-3 min-w-0 font-body">
                    <h3 className="font-semibold text-sm mb-2 text-gray-800 font-title">
                      Incidents in{" "}
                      {searchTerm
                        ? highlightSearchTerm(
                            popupInfo.properties.displayName,
                            searchTerm,
                          )
                        : popupInfo.properties.displayName}
                    </h3>

                    <div className="text-xs text-gray-600 mb-3 flex gap-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 rounded-full py-1 px-2">
                        {popupInfo.properties.totalReports} total reports
                      </span>
                      {popupInfo.properties.totalInjuries > 0 && (
                        <span className="bg-orange-100 text-orange-800 rounded-full py-1 px-2">
                          {popupInfo.properties.totalInjuries} injuries
                        </span>
                      )}
                      {popupInfo.properties.totalFatalities > 0 && (
                        <span className="bg-red-100 text-red-800 rounded-full py-1 px-2">
                          {popupInfo.properties.totalFatalities} fatalities
                        </span>
                      )}
                    </div>

                    {popupInfo.properties.incidentTypeDescriptions && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">
                          Incident Details:
                        </h4>
                        <div className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                          {searchTerm
                            ? highlightSearchTerm(
                                popupInfo.properties.incidentTypeDescriptions,
                                searchTerm,
                              )
                            : popupInfo.properties.incidentTypeDescriptions}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              )}

              {anonymousIncidentReports.isPending && (
                <div className="absolute z-10 w-full h-full backdrop-blur-sm grid place-items-center">
                  <Loader className="text-dark" size="24" />
                </div>
              )}
            </Map>
          </SidebarInset>{" "}
          <AppSidebar side="right" className="" />
        </SidebarProvider>
      </section>
    </>
  );
};

export default LiveIncidentMap;
