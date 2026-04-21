import z from "zod";

// Location object schema based on LocationIQ API response
export const locationSchema = z.object({
  place_id: z.string(),
  licence: z.string(),
  osm_type: z.string(),
  osm_id: z.string(),
  boundingbox: z.array(z.string()),
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
  class: z.string().optional(),
  type: z.string().optional(),
  importance: z.number().optional(),
});

export const entityOptions = [
  "law-enforcement",
  "security-forces",
  "judicial-system",
  "government-officials",
  "victims-witnesses",
  "journalists-media",
  "activists-protestors",
  "human-rights-organizations",
  "csos",
  "united-nations",
  "regional-bodies",
  "foreign-governments",
  "international-ngos",
  "private-security-firms",
  "private-sector-corporations",
  "legal-professionals",
  "perpetrators",
] as const;

export const casualtyOptions = ["0", "1", "2", "3", "4", "5", "6+"] as const;

export const formSchema = z.object({
  category: z
    .string()
    .min(1, {
      message: "Please select an incident category.",
    })
    .describe("The ID of the selected incident category"),
  location: locationSchema.refine((location) => location.place_id, {
    message: "Please select a valid location.",
  }),
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
  evidenceFileKey: z.string().optional().nullable(),
  audioFileKey: z.string().optional().nullable(),
});

export type FormData = z.infer<typeof formSchema>;
export type LocationData = z.infer<typeof locationSchema>;
