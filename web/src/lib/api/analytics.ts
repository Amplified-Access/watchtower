import { api } from "./client";

/** How an aggregate splits its results. Must match the Go handler's set. */
export type AnalyticsGroupBy = "country" | "type" | "day" | "week" | "month";

export type AnalyticsBucket = {
  key: string;
  reports: number;
  injuries: number;
  fatalities: number;
};

export type AppliedFilter = {
  country?: string;
  type?: string;
  period?: string;
  from?: string;
  to?: string;
  query?: string;
};

export type AnalyticsResult = {
  applied: AppliedFilter;
  groupBy?: AnalyticsGroupBy;
  totals: AnalyticsBucket;
  buckets: AnalyticsBucket[];
  truncated: boolean;
};

export type DataOverview = {
  totalReports: number;
  firstReportAt?: string;
  lastReportAt?: string;
  countries: AnalyticsBucket[];
  types: AnalyticsBucket[];
};

export type IncidentQuery = {
  groupBy?: AnalyticsGroupBy;
  country?: string;
  category?: string;
  period?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
};

export const analyticsApi = {
  /** Counts of reports, injuries and fatalities for a filter. */
  queryIncidents: (query: IncidentQuery) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    return api.get<AnalyticsResult>(`/analytics/incidents${qs ? `?${qs}` : ""}`);
  },

  /** What report data exists, and the exact names a query can filter by. */
  getOverview: () => api.get<DataOverview>("/analytics/overview"),
};
