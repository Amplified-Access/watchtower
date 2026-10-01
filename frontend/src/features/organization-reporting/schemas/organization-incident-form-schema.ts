import z from "zod";
import {
  entityOptions,
  casualtyOptions,
  emptyLocation,
  pickedLocation,
  locationSchema as originalLocationSchema,
} from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";

// Additional options for organization reports
export const severityOptions = ["low", "medium", "high", "critical"] as const;

export const organizationIncidentFormSchema = z.object({
  category: z
    .string()
    .min(1, {
      message: "Please select an incident category.",
    })
    .describe("The ID of the selected incident category"),
  // Searched with Google, as on the public report form.
  location: pickedLocation("Please select a location."),
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
  emptyLocation,
  entityOptions,
  casualtyOptions,
};
export type { LocationData } from "@/features/anonymous-reporting/schemas/anonymous-incident-reproting-form-schema";
