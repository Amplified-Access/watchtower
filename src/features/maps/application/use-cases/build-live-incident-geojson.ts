import type {
  CombinedIncidentReport,
  GeoIncidentFeatureCollection,
} from "../../domain/map-report";

export const buildLiveIncidentGeoJson = (
  reports: CombinedIncidentReport[] | null | undefined,
): GeoIncidentFeatureCollection => {
  if (!reports?.length) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const features = reports
    .filter((report) => report.lat && report.lon)
    .map((report) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [Number(report.lon), Number(report.lat)] as [number, number],
      },
      properties: {
        totalReports: Number(report.totalReports) || 1,
        totalInjuries: Number(report.totalInjuries) || 0,
        totalFatalities: Number(report.totalFatalities) || 0,
        displayName: String(report.displayName || "Unknown Location"),
        incidentTypeDescriptions: String(report.incidentTypeDescriptions || ""),
      },
    }));

  return {
    type: "FeatureCollection",
    features,
  };
};
