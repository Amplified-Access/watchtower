"use client";
import Map, { Layer, Marker, Source, Popup } from "react-map-gl/mapbox";
// If using with mapbox-gl v1:
// import Map from 'react-map-gl/mapbox-legacy';
import "mapbox-gl/dist/mapbox-gl.css";
import "../../map-popup.css";
import { Input } from "@/components/ui/input";
import Container from "@/components/common/container";
import { MapPin, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "../africawide-heatmap/map-side-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { BsIncognito } from "react-icons/bs";
import { cn } from "@/lib/utils";
import type { CircleLayer } from "mapbox-gl";
import { useState, useRef, useEffect, Fragment } from "react";
import type { MapMouseEvent } from "react-map-gl/mapbox";

const DynamicMap = () => {
  // State for popup tooltip
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    properties: any;
  } | null>(null);

  // Sample GeoJSON data - replace this with your actual data source
  const sampleData = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [35.5, -2.0],
        },
        properties: {
          name: "Location 1",
          description: "This is a sample location in Kenya",
          type: "Incident",
          severity: "High",
        },
      },
      {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [36.0, -1.5],
        },
        properties: {
          name: "Location 2",
          description: "Another sample location",
          type: "Report",
          severity: "Medium",
        },
      },
      {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [35.8, -2.3],
        },
        properties: {
          name: "Location 3",
          description: "Third sample location",
          type: "Alert",
          severity: "Low",
        },
      },
    ],
  };

  const layerStyle: CircleLayer = {
    id: "points",
    type: "circle",
    source: "points",
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "severity"], "High"],
        12,
        ["==", ["get", "severity"], "Medium"],
        8,
        6,
      ],
      "circle-color": [
        "case",
        ["==", ["get", "severity"], "High"],
        "#ef4444",
        ["==", ["get", "severity"], "Medium"],
        "#f97316",
        "#22c55e",
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  };

  // Handle click on map features
  const onMapClick = (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      setPopupInfo({
        longitude: (feature.geometry as any).coordinates[0],
        latitude: (feature.geometry as any).coordinates[1],
        properties: feature.properties,
      });
    }
  };

  // Handle hover for cursor change
  const onMouseEnter = () => {
    if (typeof window !== "undefined") {
      document.body.style.cursor = "pointer";
    }
  };

  const onMouseLeave = () => {
    if (typeof window !== "undefined") {
      document.body.style.cursor = "";
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
                  {/* <Image
            src={"/images/logo-primary.png"}
            alt={""}
            width={300}
            height={300}
            className="h-8 w-fit"
          /> */}
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
                longitude: 35.56903950377422,
                latitude: -2.5148461502670441,
                zoom: 5.3,
              }}
              minZoom={6} // The minimum zoom level
              maxZoom={12}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/grace-noble/cmezg8w4q01j901pj9eugevl4"
              // mapStyle="mapbox://styles/mapbox/streets-v9"
              onClick={onMapClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              interactiveLayerIds={["points"]}
            >
              <Marker longitude={-100} latitude={40} anchor="bottom">
                <MapPin className="fill-primary" />
              </Marker>

              {/* Source and Layer for data points with tooltips */}
              <Source id="points" type="geojson" data={"/africa_data.geojson"}>
                <Layer {...layerStyle} />
              </Source>

              {/* Popup tooltip */}
              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="bottom"
                  closeButton={true}
                  closeOnClick={false}
                  onClose={() => setPopupInfo(null)}
                  className="map-popup"
                  maxWidth="250px"
                  offset={15}
                >
                  <div className="p-3 min-w-0 font-body">
                    <h3 className="font-semibold text-sm mb-2 text-gray-800 font-title">
                      {popupInfo.properties.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {popupInfo.properties.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {popupInfo.properties.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          popupInfo.properties.severity === "High"
                            ? "bg-red-100 text-red-800"
                            : popupInfo.properties.severity === "Medium"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {popupInfo.properties.severity}
                      </span>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </SidebarInset>{" "}
          <AppSidebar side="right" className="" />
        </SidebarProvider>
      </section>
    </>
  );
};

export default DynamicMap;
