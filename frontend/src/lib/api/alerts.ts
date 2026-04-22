import { api } from "./client";

export interface AlertSubscription {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  incidentTypes?: string[];
  locations?: LocationPreference[];
  severityLevels?: string[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  alertFrequency: string;
  isActive: boolean;
  preferredLanguage: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPreference {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface AlertStats {
  total: number;
  active: number;
  inactive: number;
}

export const alertsApi = {
  create: (data: {
    email: string;
    name?: string;
    phone?: string;
    incidentTypes: string[];
    locations: LocationPreference[];
    severityLevels: string[];
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    alertFrequency?: string;
    timezone?: string;
    preferredLanguage?: string;
  }) => api.post("/alerts", data),

  getByEmail: (email: string) =>
    api.get<AlertSubscription[]>(`/alerts?email=${encodeURIComponent(email)}`),

  deactivate: (id: string) => api.post(`/alerts/${id}/deactivate`),

  activate: (id: string) => api.post(`/alerts/${id}/activate`),

  getAllActive: () => api.get<AlertSubscription[]>("/superadmin/alerts/active"),

  getStats: () => api.get<AlertStats>("/superadmin/alerts/stats"),
};
