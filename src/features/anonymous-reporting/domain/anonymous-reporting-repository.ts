import type {
  AfricawideHeatmapPoint,
  AnonymousIncidentReportDraft,
  AnonymousIncidentReportFilters,
  AnonymousReportLocationAggregate,
  CombinedIncidentReportAggregate,
  CombinedIncidentReportFilters,
  IncidentTypeDto,
} from "./anonymous-reporting.types";

export interface AnonymousReportingRepository {
  getAllIncidentTypes(): Promise<IncidentTypeDto[]>;

  getActiveIncidentTypesForMaps(): Promise<
    Array<
      IncidentTypeDto & {
        anonymousReportCount: unknown;
        organizationReportCount: unknown;
        totalReportCount: unknown;
      }
    >
  >;

  createAnonymousIncidentReport(
    input: AnonymousIncidentReportDraft,
  ): Promise<void>;

  getAllAnonymousIncidentReports(
    filters: AnonymousIncidentReportFilters,
  ): Promise<AnonymousReportLocationAggregate[]>;

  getAfricawideHeatmapData(): Promise<AfricawideHeatmapPoint[]>;

  getCombinedIncidentReports(
    filters: CombinedIncidentReportFilters,
  ): Promise<CombinedIncidentReportAggregate[]>;
}
