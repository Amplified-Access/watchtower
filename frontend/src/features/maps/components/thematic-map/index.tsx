"use client";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Funnel, Search, X } from "lucide-react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ThematicMapSidebar } from "./thematic-map-sidebar";
import { trpc } from "@/_trpc/client";
import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Loader from "@/components/common/loader";
import { useQueryState } from "nuqs";
import Logo from "@/components/logo";
import { generateIncidentTypeAssets } from "@/utils/generate-incident-type-assets";

interface ThematicMapProps {
  theme: string;
  title: string;
  description: string;
}

const ThematicMap = ({ theme, title, description }: ThematicMapProps) => {
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Debug: Log the data received
  useEffect(() => {
    if (anonymousIncidentReports.data) {
      console.log(`🗺️ Thematic Map [${theme}] - Data received:`, {
        totalReports: anonymousIncidentReports.data?.data?.length,
        reports: anonymousIncidentReports.data?.data,
        filters: {
          country: name,
          category: theme,
          search: searchTerm,
          timeframe,
        },
      });
    }
  }, [anonymousIncidentReports.data, theme, name, searchTerm, timeframe]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (idx: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMarker(idx);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null);
    }, 100); // Small delay to prevent flickering
  };

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

  // Generate dynamic theme assets
  const themeAssets = generateIncidentTypeAssets(theme);
  const themeColor: string = themeAssets.colors.primary;

  return (
    <>
      <section>
        <SidebarProvider defaultOpen={true}>
          <SidebarInset>
            <header className="fixed w-full bg-background top-0 z-20 flex h-16 shrink-0 items-center border-0">
              <div className="flex items-center gap-2 px-3 w-full justify-between">
                <Logo color={"white"} />
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
                </div>
                <SidebarTrigger className="rounded-full bg-primary hover:text-white hover:bg-primary text-white">
                  <Funnel />
                </SidebarTrigger>
              </div>
            </header>
            <Map
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              initialViewState={{
                longitude: 36.817223,
                latitude: -1.286389,
                zoom: 5.3,
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v9"
            >
              <div className="absolute top-20 -translate-x-1/2 left-1/2 max-w-86 w-full mr-32 md:hidden">
                <form action={handleSubmitSearchTerm}>
                  <Input
                    placeholder={`Search ${theme.toLowerCase()} incidents...`}
                    name="searchTerm"
                    defaultValue={searchTerm}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className={`rounded-full placeholder:text-sm shadow-none bg-white mx-auto pr-16 ${
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
              {anonymousIncidentReports.data?.data.map((report, idx) => {
                if (!report.lat || !report.lon) return null;

                // Scale marker size based on number of reports
                const reportCount = Number(report.totalReports) || 1;
                const baseSize = 16; // Base size in pixels
                const maxSize = 32; // Maximum size
                const scaleFactor = Math.min(
                  Math.log(reportCount + 1) * 0.5,
                  2,
                ); // Logarithmic scaling
                const markerSize = Math.min(
                  baseSize + reportCount * 2,
                  maxSize,
                );

                // Pre-process the data to ensure proper typing
                const totalReports = String(report.totalReports || 0);
                const totalInjuries = String(report.totalInjuries || 0);
                const totalFatalities = String(report.totalFatalities || 0);
                const displayName = String(
                  report.displayName || "Unknown Location",
                );

                // Use the incident type color from database, fallback to theme color
                const markerColor: string =
                  (report.incidentTypeColor as string) ||
                  themeColor ||
                  "#ef4444";

                return (
                  <Fragment key={idx}>
                    <Marker
                      longitude={Number(report.lon)}
                      latitude={Number(report.lat)}
                      anchor="bottom"
                    >
                      <div
                        onMouseEnter={() => handleMouseEnter(idx)}
                        onMouseLeave={handleMouseLeave}
                        className="cursor-pointer hover:scale-110 transition-transform duration-200 grid place-items-center animate-pulse rounded-full bg-radial from-current via-current/20 to-transparent relative"
                        style={{
                          width: `${markerSize * 0.75}px`,
                          height: `${markerSize * 0.75}px`,
                          backgroundColor: `${markerColor}33`, // 20% opacity
                          backgroundImage: `radial-gradient(circle, ${markerColor}, ${markerColor}33, transparent)`,
                        }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: `${markerSize * 0.25}px`,
                            height: `${markerSize * 0.25}px`,
                            backgroundColor: markerColor,
                          }}
                        />
                      </div>
                    </Marker>
                    {hoveredMarker === idx && (
                      <Popup
                        longitude={Number(report.lon)}
                        latitude={Number(report.lat)}
                        anchor="top"
                        closeButton={false}
                        closeOnClick={false}
                        focusAfterOpen={false}
                        className="incident-popup"
                        maxWidth="320px"
                        offset={15}
                      >
                        <div className="p-4 min-w-0 font-body">
                          <h3 className="font-semibold text-sm mb-2 text-gray-800 font-title">
                            {theme} in{" "}
                            {searchTerm
                              ? highlightSearchTerm(displayName, searchTerm)
                              : displayName}
                          </h3>

                          <div className="text-xs text-gray-600 mb-3 flex gap-2 flex-wrap">
                            <span className="bg-blue-100 text-blue-800 rounded-full py-1 px-2">
                              {totalReports} reports
                            </span>
                            {Number(totalInjuries) > 0 ? (
                              <span className="bg-orange-100 text-orange-800 rounded-full py-1 px-2">
                                {totalInjuries} injuries
                              </span>
                            ) : null}
                            {Number(totalFatalities) > 0 ? (
                              <span className="bg-red-100 text-red-800 rounded-full py-1 px-2">
                                {totalFatalities} fatalities
                              </span>
                            ) : null}
                          </div>

                          <Fragment>
                            {/* @ts-expect-error incidentTypeDescriptions not in type */}
                            {report.incidentTypeDescriptions && (
                              <div className="space-y-1">
                                <h4 className="text-xs font-medium text-gray-700 mb-1">
                                  Details:
                                </h4>
                                <div className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                                  {searchTerm
                                    ? highlightSearchTerm(
                                        String(report.incidentTypeDescriptions),
                                        searchTerm,
                                      )
                                    : String(report.incidentTypeDescriptions)}
                                </div>
                              </div>
                            )}
                          </Fragment>

                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: (anonymousIncidentReports
                                    ?.data?.data &&
                                  anonymousIncidentReports.data.data.length > 0
                                    ? (anonymousIncidentReports.data.data[0]
                                        .incidentTypeColor as string) ||
                                      themeColor ||
                                      "#ef4444"
                                    : themeColor || "#ef4444") as string,
                                }}
                              ></div>
                              <span className="text-xs font-medium text-gray-700">
                                {theme}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Fragment>
                );
              })}
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
