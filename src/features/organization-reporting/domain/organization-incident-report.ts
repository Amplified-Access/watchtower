export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface OrganizationLocation {
  lat: number;
  lon: number;
  admin1: string;
  region: string;
  country: string;
}

export interface OrganizationIncidentDraft {
  organizationId: string;
  reportedByUserId: string;
  incidentTypeId: string;
  location: OrganizationLocation;
  description: string;
  entities: string[];
  injuries: number;
  fatalities: number;
  severity: IncidentSeverity;
}

export interface OrganizationIncidentReport {
  id: string;
  organizationId: string;
  reportedByUserId: string;
  incidentTypeId: string;
  incidentTypeName: string | null;
  location: OrganizationLocation;
  description: string;
  entities: string[];
  injuries: number;
  fatalities: number;
  severity: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationIncidentAggregate {
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
  severity: string | null;
  verified: boolean;
  source: string;
}

export interface OrganizationIncidentFilters {
  country?: string;
  category?: string;
  severity?: IncidentSeverity;
  verified?: boolean;
  search?: string;
  limit: number;
  offset: number;
}

export interface UserOrganizationIncidentFilters {
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}

export interface OrganizationIncidentStats {
  totalReports: number;
  totalFatalities: string | number | null;
  totalInjuries: string | number | null;
  verifiedReports: number;
  unverifiedReports: number;
  criticalReports: number;
  highSeverityReports: number;
}
