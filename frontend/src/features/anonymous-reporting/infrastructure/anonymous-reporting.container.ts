import { GetActiveIncidentTypesForMaps } from "../application/use-cases/get-active-incident-types-for-maps";
import { GetAfricawideHeatmapData } from "../application/use-cases/get-africawide-heatmap-data";
import { GetAllAnonymousIncidentReports } from "../application/use-cases/get-all-anonymous-incident-reports";
import { GetAllIncidentTypes } from "../application/use-cases/get-all-incident-types";
import { GetCombinedIncidentReports } from "../application/use-cases/get-combined-incident-reports";
import { SearchLocation } from "../application/use-cases/search-location";
import { SubmitAnonymousIncidentReport } from "../application/use-cases/submit-anonymous-incident-report";
import type { AnonymousReportingRepository } from "../domain/anonymous-reporting-repository";
import type { LocationSearchProvider } from "../domain/location-search-provider";
import { LocationIqLocationSearchProvider } from "./providers/location-iq-location-search-provider";
import { DrizzleAnonymousReportingRepository } from "./repositories/drizzle-anonymous-reporting-repository";

export interface AnonymousReportingUseCases {
  getAllIncidentTypes: GetAllIncidentTypes;
  getActiveIncidentTypesForMaps: GetActiveIncidentTypesForMaps;
  searchLocation: SearchLocation;
  submitAnonymousIncidentReport: SubmitAnonymousIncidentReport;
  getAllAnonymousIncidentReports: GetAllAnonymousIncidentReports;
  getAfricawideHeatmapData: GetAfricawideHeatmapData;
  getCombinedIncidentReports: GetCombinedIncidentReports;
}

export const createAnonymousReportingUseCases = (
  repository: AnonymousReportingRepository = new DrizzleAnonymousReportingRepository(),
  locationProvider: LocationSearchProvider = new LocationIqLocationSearchProvider(),
): AnonymousReportingUseCases => {
  return {
    getAllIncidentTypes: new GetAllIncidentTypes(repository),
    getActiveIncidentTypesForMaps: new GetActiveIncidentTypesForMaps(
      repository,
    ),
    searchLocation: new SearchLocation(locationProvider),
    submitAnonymousIncidentReport: new SubmitAnonymousIncidentReport(
      repository,
    ),
    getAllAnonymousIncidentReports: new GetAllAnonymousIncidentReports(
      repository,
    ),
    getAfricawideHeatmapData: new GetAfricawideHeatmapData(repository),
    getCombinedIncidentReports: new GetCombinedIncidentReports(repository),
  };
};
