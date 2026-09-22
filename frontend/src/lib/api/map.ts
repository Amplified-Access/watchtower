import { api } from "./client";

// Mirrors entity.MapPeriod in the Go backend.
export type MapPeriod = "24h" | "7d" | "30d" | "week" | "month" | "year";

export interface MapFilter {
  /** Incident type name, as the thematic maps use it. */
  category?: string;
  /** Incident type IDs to leave out. */
  excludeTypes?: string[];
  country?: string;
  period?: MapPeriod;
  /** Custom range, YYYY-MM-DD; `to` is inclusive. Use instead of `period`. */
  from?: string;
  to?: string;
  q?: string;
}

export interface MapFeatureProperties {
  id: string;
  name: string;
  country?: string;
  createdAt: string;
}

/** GeoJSON from the backend, ready to hand to a Mapbox source as-is. */
export interface MapFeatureCollection {
  type: "FeatureCollection";
  /** [minLon, minLat, maxLon, maxLat]; absent when there are no features. */
  bbox?: [number, number, number, number];
  features: {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: MapFeatureProperties;
  }[];
}

export interface MapSummary {
  totalReports: number;
  /** Reports from the last 7 days. */
  recentReports: number;
  /** Sorted by count, most reported first. */
  countries: { name: string; count: number }[];
  /** Sorted by count, most reported first. */
  types: { id: string; name: string; color: string; count: number }[];
}

export interface MapReportDetail {
  id: string;
  incidentTypeId: string;
  name: string;
  country?: string;
  description: string;
  injuries: number;
  fatalities: number;
  createdAt: string;
}

const toQuery = (filter: MapFilter = {}) => {
  const query = new URLSearchParams();
  if (filter.category) query.set("category", filter.category);
  if (filter.excludeTypes?.length) query.set("excludeTypes", filter.excludeTypes.join(","));
  if (filter.country) query.set("country", filter.country);
  if (filter.period) query.set("period", filter.period);
  if (filter.from) query.set("from", filter.from);
  if (filter.to) query.set("to", filter.to);
  if (filter.q?.trim()) query.set("q", filter.q.trim());
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const mapApi = {
  getPoints: (filter?: MapFilter) => api.get<MapFeatureCollection>(`/map/points${toQuery(filter)}`),
  getSummary: (filter?: MapFilter) => api.get<MapSummary>(`/map/summary${toQuery(filter)}`),
  getReport: (id: string) => api.get<MapReportDetail>(`/map/reports/${encodeURIComponent(id)}`),
};
