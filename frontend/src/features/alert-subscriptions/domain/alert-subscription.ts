export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertFrequency = "immediate" | "hourly" | "daily" | "weekly";

export interface AlertLocation {
  name: string;
  country: string;
  radius: number;
  lat?: number;
  lon?: number;
}

export interface AlertSubscriptionDraft {
  email: string;
  name: string;
  phone?: string | null;
  incidentTypes: string[];
  locations: AlertLocation[];
  severityLevels: AlertSeverity[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  alertFrequency: AlertFrequency;
  preferredLanguage: string;
  timezone: string;
}

export interface AlertSubscription {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  incidentTypes: unknown;
  locations: unknown;
  severityLevels: unknown;
  emailNotifications: boolean | null;
  smsNotifications: boolean | null;
  alertFrequency: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  preferredLanguage: string | null;
  timezone: string | null;
}

export interface AlertSubscriptionStats {
  totalActive: number;
  frequencyStats: Record<string, number>;
  incidentTypeStats: Record<string, number>;
  averageIncidentTypesPerUser: number;
}

export interface AlertSubscriptionUpdate {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  incidentTypes?: string[];
  locations?: AlertLocation[];
  severityLevels?: AlertSeverity[];
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  alertFrequency?: AlertFrequency;
  preferredLanguage?: string;
  timezone?: string;
}
