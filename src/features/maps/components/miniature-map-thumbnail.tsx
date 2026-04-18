"use client";

import { trpc } from "@/_trpc/client";
import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MiniatureMapThumbnailProps {
  incidentTypeName: string;
  incidentTypeColor?: string;
  className?: string;
}

const MiniatureMapThumbnail = ({
  incidentTypeName,
  incidentTypeColor = "#ef4444",
  className = "aspect-12/9 w-full rounded-lg",
}: MiniatureMapThumbnailProps) => {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Fetch combined incident reports (both anonymous and organization) for this specific incident type
  const { data: incidentReports, isLoading } =
    trpc.anonymousReports.getCombinedIncidentReports.useQuery({
      category: incidentTypeName,
    });

  useEffect(() => {
    if (!mapContainer || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;

    // Initialize Mapbox
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/mapbox/streets-v9", // Same as live incident map
      center: [40.817223, -6.286389], // Same as live incident map
      zoom: 3, // Same as live incident map
      interactive: false, // Disable all interactions
      attributionControl: false, // Remove attribution for cleaner look
      logoPosition: "bottom-right",
    });

    // Disable all map interactions
    mapInstance.dragPan.disable();
    mapInstance.scrollZoom.disable();
    mapInstance.boxZoom.disable();
    mapInstance.dragRotate.disable();
    mapInstance.keyboard.disable();
    mapInstance.doubleClickZoom.disable();
    mapInstance.touchZoomRotate.disable();

    mapInstance.on("load", () => {
      setIsMapLoaded(true);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [mapContainer]);

  useEffect(() => {
    if (!map || !isMapLoaded || !incidentReports?.data) return;

    const reports = incidentReports.data;

    if (reports.length === 0) return;

    // Calculate bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();
    const validReports = reports.filter(
      (report: any) => report.lat && report.lon
    );

    if (validReports.length === 0) return;

    validReports.forEach((report: any) => {
      bounds.extend([Number(report.lon), Number(report.lat)]);
    });

    // Only adjust the view if we have multiple scattered points
    // For single or nearby points, keep the default Eastern Africa view
    // if (validReports.length > 1) {
    //   const sw = bounds.getSouthWest();
    //   const ne = bounds.getNorthEast();
    //   const latDiff = ne.lat - sw.lat;
    //   const lngDiff = ne.lng - sw.lng;

    //   // Only fit bounds if the points are spread out enough
    //   if (latDiff > 0.5 || lngDiff > 0.5) {
    //     map.fitBounds(bounds, {
    //       padding: 30,
    //       maxZoom: 7, // Slightly more conservative max zoom
    //     });
    //   }
    // }

    // Add markers
    validReports.forEach((report: any) => {
      const reportCount = Number(report.totalReports) || 1;
      const baseSize = 4; // Smaller base size for thumbnails
      const maxSize = 8; // Smaller max size for thumbnails
      const scaleFactor = Math.min(Math.log(reportCount + 1) * 0.5, 2);
      const markerSize = Math.max(
        baseSize,
        Math.min(maxSize, baseSize * scaleFactor)
      );

      // Create marker element
      const markerElement = document.createElement("div");
      markerElement.style.width = `${markerSize}px`;
      markerElement.style.height = `${markerSize}px`;
      markerElement.style.backgroundColor = incidentTypeColor;
      markerElement.style.borderRadius = "50%";
      markerElement.style.border = "1px solid rgba(255,255,255,0.8)";
      markerElement.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat([Number(report.lon), Number(report.lat)])
        .addTo(map);
    });
  }, [map, isMapLoaded, incidentReports, incidentTypeColor]);

  return (
    <div className={className}>
      <div
        ref={setMapContainer}
        className="w-full h-full rounded-lg overflow-hidden bg-gray-100"
        style={{ minHeight: "200px" }}
      />
      {/* Loading state */}
      {(isLoading || !isMapLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg animate-pulse"></div>
      )}
      {/* No data state */}
      {!isLoading &&
        isMapLoaded &&
        (!incidentReports?.data || incidentReports.data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2"
                style={{ backgroundColor: incidentTypeColor }}
              />
              <p className="text-xs text-gray-500">No data available</p>
            </div>
          </div>
        )}
    </div>
  );
};

export default MiniatureMapThumbnail;
