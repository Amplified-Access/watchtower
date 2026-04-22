import type {
  AfricawideIncidentReport,
  HeatmapFilterThresholds,
  HeatmapLocationMarker,
} from "../../domain/map-report";

const INCIDENT_TYPE_MAPPING: Record<keyof HeatmapFilterThresholds, string[]> = {
  violence_civilians: ["Violence against civilians"],
  battles: ["Battles"],
  strategic: ["Strategic developments"],
  explosions: ["Explosions/Remote violence"],
  protests: ["Protests"],
  riots: ["Riots"],
};

const getIncidentTypeCount = (
  incidentTypeStats: Record<string, number>,
  filterKey: keyof HeatmapFilterThresholds,
) => {
  const matchingTypes = INCIDENT_TYPE_MAPPING[filterKey] || [];

  return Object.entries(incidentTypeStats).reduce((total, [type, count]) => {
    const matchesCategory = matchingTypes.some(
      (matchingType) =>
        type.toLowerCase().includes(matchingType.toLowerCase()) ||
        matchingType.toLowerCase().includes(type.toLowerCase()),
    );

    return matchesCategory ? total + count : total;
  }, 0);
};

export const aggregateAfricawideMarkers = (
  reports: AfricawideIncidentReport[] | null | undefined,
): Record<string, HeatmapLocationMarker> => {
  if (!reports?.length) {
    return {};
  }

  return reports.reduce(
    (acc, report) => {
      if (!report.lat || !report.lon) {
        return acc;
      }

      const locationKey = `${report.lat},${report.lon}`;

      if (!acc[locationKey]) {
        acc[locationKey] = {
          lat: Number(report.lat),
          lng: Number(report.lon),
          location: report.displayName || report.country || "Unknown Location",
          incidentTypeStats: {},
          totalIncidents: 0,
          totalFatalities: 0,
          totalInjuries: 0,
        };
      }

      const incidentType = report.incidentType || "Unknown";
      acc[locationKey].incidentTypeStats[incidentType] =
        (acc[locationKey].incidentTypeStats[incidentType] || 0) +
        (report.incidentCount || 1);
      acc[locationKey].totalIncidents += report.incidentCount || 1;
      acc[locationKey].totalFatalities +=
        Number.parseInt(String(report.totalFatalities || 0), 10) || 0;
      acc[locationKey].totalInjuries +=
        Number.parseInt(String(report.totalInjuries || 0), 10) || 0;

      return acc;
    },
    {} as Record<string, HeatmapLocationMarker>,
  );
};

export const filterAfricawideMarkers = (
  markers: Record<string, HeatmapLocationMarker>,
  thresholds: HeatmapFilterThresholds,
): Record<string, HeatmapLocationMarker> => {
  return Object.fromEntries(
    Object.entries(markers).filter(([, location]) => {
      const violenceCiviliansCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "violence_civilians",
      );
      const battlesCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "battles",
      );
      const strategicCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "strategic",
      );
      const explosionsCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "explosions",
      );
      const protestsCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "protests",
      );
      const riotsCount = getIncidentTypeCount(
        location.incidentTypeStats,
        "riots",
      );

      return (
        violenceCiviliansCount >= thresholds.violence_civilians &&
        battlesCount >= thresholds.battles &&
        strategicCount >= thresholds.strategic &&
        explosionsCount >= thresholds.explosions &&
        protestsCount >= thresholds.protests &&
        riotsCount >= thresholds.riots
      );
    }),
  );
};
