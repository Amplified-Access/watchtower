export interface CombinedIncidentReport {
  lat: string | number | null;
  lon: string | number | null;
  totalReports?: string | number | null;
  totalInjuries?: string | number | null;
  totalFatalities?: string | number | null;
  displayName?: string | null;
  incidentTypeDescriptions?: string | null;
  incidentTypeColor?: string | null;
}

export interface AfricawideIncidentReport {
  lat: string | number | null;
  lon: string | number | null;
  displayName?: string | null;
  country?: string | null;
  incidentType?: string | null;
  incidentCount?: number | null;
  totalFatalities?: string | number | null;
  totalInjuries?: string | number | null;
}

export interface GeoIncidentFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    totalReports: number;
    totalInjuries: number;
    totalFatalities: number;
    displayName: string;
    incidentTypeDescriptions: string;
  };
}

export interface GeoIncidentFeatureCollection {
  type: "FeatureCollection";
  features: GeoIncidentFeature[];
}

export interface MapViewport {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface HeatmapLocationMarker {
  lat: number;
  lng: number;
  location: string;
  incidentTypeStats: Record<string, number>;
  totalIncidents: number;
  totalFatalities: number;
  totalInjuries: number;
}

export interface HeatmapFilterThresholds {
  violence_civilians: number;
  battles: number;
  strategic: number;
  explosions: number;
  protests: number;
  riots: number;
}
