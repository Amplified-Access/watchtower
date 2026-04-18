import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const alertSubscriptions = pgTable("alert_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // User information
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }), // Optional for SMS alerts

  // Subscription preferences
  incidentTypes: jsonb("incident_types").notNull(), // Array of incident type IDs
  locations: jsonb("locations").notNull(), // Array of location objects with lat, lon, radius, name
  severityLevels: jsonb("severity_levels").notNull(), // Array of severity levels: ["low", "medium", "high", "critical"]

  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),

  // Additional preferences
  alertFrequency: varchar("alert_frequency", { length: 50 }).default(
    "immediate"
  ), // immediate, hourly, daily
  isActive: boolean("is_active").default(true),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Optional user preferences
  preferredLanguage: varchar("preferred_language", { length: 10 }).default(
    "en"
  ),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
});

export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type NewAlertSubscription = typeof alertSubscriptions.$inferInsert;

// Type for location preferences
export interface LocationPreference {
  name: string;
  lat: number;
  lon: number;
  radius: number; // radius in kilometers
  admin1?: string;
  country?: string;
}

// Type for the complete subscription data
export interface SubscriptionPreferences {
  incidentTypes: string[]; // Array of incident type IDs
  locations: LocationPreference[];
  severityLevels: ("low" | "medium" | "high" | "critical")[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  alertFrequency: "immediate" | "hourly" | "daily";
  preferredLanguage: string;
  timezone: string;
}
