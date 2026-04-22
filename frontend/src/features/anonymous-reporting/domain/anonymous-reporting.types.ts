export interface IncidentTypeDto {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnonymousReportLocationAggregate {
  region: string | null;
  country: string | null;
  totalFatalities: string | number | null;
  totalInjuries: string | number | null;
  totalReports: number;
  lat: number | null;
  lon: number | null;
  displayName: string | null;
  incidentTypes: string | null;
  incidentTypeColor: string | null;
}

export interface AfricawideHeatmapPoint {
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  displayName: string | null;
  incidentType: string | null;
  totalFatalities: string | number | null;
  totalInjuries: string | number | null;
  incidentCount: number;
}

export interface CombinedIncidentReportAggregate {
  region: string | null;
  country: string | null;
  totalFatalities: string | number | null;
  totalInjuries: string | number | null;
  totalReports: number;
  lat: number | null;
  lon: number | null;
  displayName: string | null;
  incidentTypes: string | null;
  incidentTypeDescriptions: string | null;
  incidentTypeColor: string | null;
  source: string;
}

export interface AnonymousIncidentReportDraft {
  category: string;
  location: Record<string, unknown>;
  description: string;
  entities: string[];
  injuries: "0" | "1" | "2" | "3" | "4" | "5" | "6+";
  fatalities: "0" | "1" | "2" | "3" | "4" | "5" | "6+";
  evidenceFileKey?: string | null;
  audioFileKey?: string | null;
}

export interface AnonymousIncidentReportFilters {
  country?: string;
  category?: string;
  sources?: string[];
  search?: string;
}

export interface CombinedIncidentReportFilters {
  country?: string;
  category?: string;
  search?: string;
  timeframe?: "week" | "month" | "year";
}
