"use client";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./map-popup.css";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { BsIncognito } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { AppSidebar } from "../africawide-heatmap/map-side-bar";
import { useState, useRef, useEffect, Fragment } from "react";

// Sample data points - replace this with your actual data
const dataPoints = [
  {
    id: 1,
    longitude: 35.5,
    latitude: -2.0,
    name: "Nairobi Region",
    description: "Security incident reported in central area",
    type: "Security Alert",
    severity: "High",
    reports: 15,
    time: "2 hours ago",
  },
  {
    id: 2,
    longitude: 36.0,
    latitude: -1.5,
    name: "Mombasa Coast",
    description: "Environmental monitoring data available",
    type: "Environmental",
    severity: "Medium",
    reports: 8,
    time: "5 hours ago",
  },
  {
    id: 3,
    longitude: 35.8,
    latitude: -2.3,
    name: "Kisumu Lake Area",
    description: "Community report submitted",
    type: "Community Report",
    severity: "Low",
    reports: 3,
    time: "1 day ago",
  },
  {
    id: 4,
    longitude: 36.2,
    latitude: -1.8,
    name: "Nakuru Hills",
    description: "Infrastructure monitoring alert",
    type: "Infrastructure",
    severity: "High",
    reports: 22,
    time: "30 minutes ago",
  },
];

const DynamicMapWithMarkers = () => {
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (id: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMarker(id);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null);
    }, 100); // Small delay to prevent flickering
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <>
      <section>
        <SidebarProvider defaultOpen={true}>
          <SidebarInset>
            <header className="fixed w-full bg-background top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-3 w-full border-0 justify-between">
                <Link href={"/"} className="flex gap-2 items-center">
                  <p
                    className={cn(
                      "text-xl flex gap-1.5 items-center font-semibold font-title",
                    )}
                  >
                    <BsIncognito size={28} /> WatchTower
                  </p>
                </Link>
                <div className="relative max-w-md w-full mr-32">
                  <Input
                    placeholder="Search for anything"
                    className=" rounded-full shadow-none bg-white mx-auto"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Search size={20} />
                  </button>
                </div>
                <SidebarTrigger />
              </div>
            </header>
            <Map
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              initialViewState={{
                longitude: 35.8,
                latitude: -2.0,
                zoom: 6,
              }}
              minZoom={5}
              maxZoom={15}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/grace-noble/cmezg8w4q01j901pj9eugevl4"
            >
              {dataPoints.map((point) => (
                <Fragment key={point.id}>
                  <Marker
                    longitude={point.longitude}
                    latitude={point.latitude}
                    anchor="bottom"
                  >
                    <div
                      onMouseEnter={() => handleMouseEnter(point.id)}
                      onMouseLeave={handleMouseLeave}
                      className={`cursor-pointer hover:scale-110 transition-transform duration-200 h-6 w-6 grid place-items-center animate-pulse rounded-full ${getSeverityColor(
                        point.severity,
                      )}/70 border-2 border-white shadow-lg`}
                    >
                      <div
                        className={`rounded-full w-3 h-3 mx-auto ${getSeverityColor(
                          point.severity,
                        )}`}
                      />
                    </div>
                  </Marker>
                  {hoveredMarker === point.id && (
                    <Popup
                      longitude={point.longitude}
                      latitude={point.latitude}
                      anchor="top"
                      closeButton={false}
                      closeOnClick={false}
                      focusAfterOpen={false}
                      className="map-popup"
                      maxWidth="280px"
                      offset={20}
                    >
                      <div className="p-4 min-w-0 font-body">
                        <h3 className="font-semibold text-base mb-2 text-gray-800 font-title">
                          {point.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {point.description}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {point.type}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityBadgeColor(
                              point.severity,
                            )}`}
                          >
                            {point.severity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{point.reports} reports</span>
                          <span>{point.time}</span>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Fragment>
              ))}
            </Map>
          </SidebarInset>
          <AppSidebar side="right" className="" />
        </SidebarProvider>
      </section>
    </>
  );
};

export default DynamicMapWithMarkers;
