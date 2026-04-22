import type {
  CombinedIncidentReport,
  MapViewport,
} from "../../domain/map-report";

export const DEFAULT_LIVE_MAP_VIEWPORT: MapViewport = {
  longitude: 52.5,
  latitude: 13,
  zoom: 3.5,
};

export const calculateViewportForReports = (
  reports: CombinedIncidentReport[] | null | undefined,
): MapViewport | null => {
  if (!reports?.length) {
    return null;
  }

  const lngs = reports
    .map((r) => Number(r.lon))
    .filter((n) => !Number.isNaN(n));
  const lats = reports
    .map((r) => Number(r.lat))
    .filter((n) => !Number.isNaN(n));

  if (!lngs.length || !lats.length) {
    return null;
  }

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const lngDiff = maxLng - minLng;
  const latDiff = maxLat - minLat;
  const maxDiff = Math.max(lngDiff, latDiff);

  let zoom = 5;
  if (maxDiff < 0.5) zoom = 10;
  else if (maxDiff < 2) zoom = 8;
  else if (maxDiff < 5) zoom = 6;
  else if (maxDiff < 15) zoom = 4;
  else if (maxDiff < 40) zoom = 3;
  else zoom = 2;

  return {
    longitude: centerLng,
    latitude: centerLat,
    zoom,
  };
};
