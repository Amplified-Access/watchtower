import z from "zod";
import {
  entityOptions,
  casualtyOptions,
  locationSchema as originalLocationSchema,
} from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";

// Additional options for organization reports
export const severityOptions = ["low", "medium", "high", "critical"] as const;

// Organization-specific location schema with simplified structure
export const organizationLocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  admin1: z.string(),
  region: z.string(),
  country: z.string(),
});

export type OrganizationLocationData = z.infer<
  typeof organizationLocationSchema
>;

export const organizationIncidentFormSchema = z.object({
  category: z
    .string()
    .min(1, {
      message: "Please select an incident category.",
    })
    .describe("The ID of the selected incident category"),
  location: organizationLocationSchema,
  description: z
    .string()
    .min(10, {
      message:
        "Please provide a detailed description (at least 10 characters).",
    })
    .max(2000, {
      message: "Description cannot exceed 2000 characters.",
    }),
  entities: z.array(z.enum(entityOptions)).min(1, {
    message: "Please select at least one entity involved.",
  }),
  injuries: z.enum(casualtyOptions, {
    message: "Please specify the number of injuries.",
  }),
  fatalities: z.enum(casualtyOptions, {
    message: "Please specify the number of fatalities.",
  }),
  severity: z.enum(severityOptions, {
    message: "Please select the incident severity.",
  }),
});

export type OrganizationIncidentFormData = z.infer<
  typeof organizationIncidentFormSchema
>;

// Export shared schemas for reuse
export {
  originalLocationSchema as locationSchema,
  entityOptions,
  casualtyOptions,
};
export type { LocationData } from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";
