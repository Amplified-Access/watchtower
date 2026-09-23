"use client";

import { trpc } from "@/_trpc/client";
import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MiniatureMapThumbnailProps {
  incidentTypeName: string;
  incidentTypeColor?: string;
  className?: string;
  mapStyle?: string;
}

const MiniatureMapThumbnail = ({
  incidentTypeName,
  incidentTypeColor = "#ef4444",
  className = "aspect-12/9 w-full rounded-lg",
  mapStyle = "mapbox://styles/mapbox/streets-v9",
}: MiniatureMapThumbnailProps) => {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Lightweight GeoJSON points for this incident type from the Go backend.
  const { data: points, isLoading } = trpc.map.points.useQuery({
    category: incidentTypeName,
  });

  useEffect(() => {
    if (!mapContainer || !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;

    // Initialize Mapbox
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer,
      style: mapStyle,
      // Framed wide enough to take in every reporting country, from Rwanda
      // and Tanzania across to Pakistan.
      center: [46, 8],
      zoom: 2.3,
      // Mapbox v3 defaults to the globe at low zoom, which shows curved dark
      // edges in these wide, cropped thumbnails.
      projection: "mercator",
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

    // The map instance is created by Mapbox and stored for later marker updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [mapContainer, mapStyle]);

  useEffect(() => {
    if (!map || !isMapLoaded || !points?.features.length) return;

    // One dot per report. The view stays on the default regional frame
    // rather than fitting the points, so every thumbnail lines up.
    const markers = points.features.map((feature) => {
      const markerElement = document.createElement("div");
      markerElement.style.width = "8px";
      markerElement.style.height = "8px";
      markerElement.style.backgroundColor = incidentTypeColor;
      markerElement.style.borderRadius = "50%";
      markerElement.style.border = "1.5px solid rgba(255,255,255,0.9)";
      markerElement.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

      return new mapboxgl.Marker(markerElement)
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [map, isMapLoaded, points, incidentTypeColor]);

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
        !points?.features.length && (
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
