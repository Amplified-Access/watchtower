"use client";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "../../map-popup.css";
import { AppSidebar } from "./map-side-bar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { BsIncognito } from "react-icons/bs";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, Fragment } from "react";
import { trpc } from "@/_trpc/client";
import { useQueryState, parseAsInteger } from "nuqs";
import Loader from "@/components/common/loader";
import {
  aggregateAfricawideMarkers,
  filterAfricawideMarkers,
  type AfricawideIncidentReport,
} from "@/features/maps";

const AfricawideHeatmap = () => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  // Read slider filter values from URL state
  const [violenceCiviliansMin] = useQueryState(
    "violence_civilians",
    parseAsInteger.withDefault(0),
  );
  const [battlesMin] = useQueryState("battles", parseAsInteger.withDefault(0));
  const [strategicMin] = useQueryState(
    "strategic",
    parseAsInteger.withDefault(0),
  );
  const [explosionsMin] = useQueryState(
    "explosions",
    parseAsInteger.withDefault(0),
  );
  const [protestsMin] = useQueryState(
    "protests",
    parseAsInteger.withDefault(0),
  );
  const [riotsMin] = useQueryState("riots", parseAsInteger.withDefault(0));

  // Get africawide heatmap data without any filters
  const africawideData =
    trpc.anonymousReports.getAfricawideHeatmapData.useQuery();

  const handleMarkerClick = (idx: number) => {
    // If clicking the same marker, close it, otherwise open the new one
    setSelectedMarker(selectedMarker === idx ? null : idx);
  };

  const handleMapClick = () => {
    // Close popup when clicking outside markers
    setSelectedMarker(null);
  };

  const processedData = useMemo(
    () =>
      aggregateAfricawideMarkers(
        africawideData.data?.data as AfricawideIncidentReport[] | undefined,
      ),
    [africawideData.data?.data],
  );

  const filteredData = useMemo(
    () =>
      filterAfricawideMarkers(processedData, {
        violence_civilians: violenceCiviliansMin,
        battles: battlesMin,
        strategic: strategicMin,
        explosions: explosionsMin,
        protests: protestsMin,
        riots: riotsMin,
      }),
    [
      processedData,
      violenceCiviliansMin,
      battlesMin,
      strategicMin,
      explosionsMin,
      protestsMin,
      riotsMin,
    ],
  );

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
                <div className="flex items-center gap-4">
                  {/* Active filter count */}
                  {(violenceCiviliansMin > 0 ||
                    battlesMin > 0 ||
                    strategicMin > 0 ||
                    explosionsMin > 0 ||
                    protestsMin > 0 ||
                    riotsMin > 0) && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {
                        [
                          violenceCiviliansMin,
                          battlesMin,
                          strategicMin,
                          explosionsMin,
                          protestsMin,
                          riotsMin,
                        ].filter((v) => v > 0).length
                      }{" "}
                      filters active
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Showing {Object.keys(filteredData).length} locations
                  </div>
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
              minZoom={6}
              maxZoom={12}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/grace-noble/cmezg8w4q01j901pj9eugevl4"
              onClick={handleMapClick}
            >
              {africawideData.isLoading ? (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <Loader />
                </div>
              ) : (
                Object.values(filteredData).map((location, idx) => (
                  <Fragment key={`${location.lat}-${location.lng}`}>
                    <Marker
                      longitude={location.lng}
                      latitude={location.lat}
                      anchor="center"
                    >
                      <div
                        className=""
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent map click
                          handleMarkerClick(idx);
                        }}
                      >
                        {/* Number marker showing total incidents */}
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-full text-white font-bold text-xs transition-all duration-200 cursor-pointer relative",
                            location.totalIncidents > 50
                              ? " w-10 h-10 text-black"
                              : location.totalIncidents > 20
                                ? " w-9 h-9 text-black"
                                : location.totalIncidents > 10
                                  ? " w-8 h-8 text-black"
                                  : " w-4 h-4 text-black",
                            selectedMarker === idx && "scale-110",
                          )}
                          style={{ zIndex: selectedMarker === idx ? 50 : 10 }}
                        >
                          {location.totalIncidents}
                        </div>
                      </div>
                    </Marker>

                    {/* Persistent popup on click */}
                    {selectedMarker === idx && (
                      <Popup
                        longitude={location.lng}
                        latitude={location.lat}
                        anchor="top"
                        closeButton={false}
                        closeOnClick={false}
                        focusAfterOpen={false}
                        className="map-popup"
                        maxWidth="320px"
                        offset={15}
                      >
                        <div
                          className="p-4 min-w-0 font-body"
                          onClick={(e) => e.stopPropagation()} // Prevent popup from closing when clicking inside
                        >
                          <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                            <div className="font-semibold text-gray-800 text-base font-title">
                              {location.location}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMarker(null);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Total Incidents:
                              </span>
                              <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {location.totalIncidents}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Total Fatalities:
                              </span>
                              <span className="font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                {location.totalFatalities}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            <div className="font-semibold mb-2 text-sm text-gray-800">
                              Incident Breakdown:
                            </div>
                            <div className="space-y-1 overflow-y-auto">
                              {Object.entries(location.incidentTypeStats).map(
                                ([type, count]) => (
                                  <div
                                    key={type}
                                    className="flex justify-between items-center text-xs"
                                  >
                                    <span className="text-gray-600 truncate flex-1 mr-2">
                                      {type}
                                    </span>
                                    <span className="font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">
                                      {count}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Fragment>
                ))
              )}
            </Map>
          </SidebarInset>
          <AppSidebar side="right" className="" />
        </SidebarProvider>
      </section>
    </>
  );
};

export default AfricawideHeatmap;
