import z from "zod";

// The incident's location: a place picked from Google's suggestions (see
// lib/google/places.ts). `label` is what the reporter picked, in their
// language; the address and country are English, as reports are stored.
export const locationSchema = z.object({
  placeId: z.string(),
  label: z.string(),
  address: z.string(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
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
  location: locationSchema.refine((location) => location.placeId, {
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
  // Optional: the redesigned public form no longer asks for entities involved.
  entities: z.array(z.enum(entityOptions)),
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
// The public report form adds a translated consent checkbox on top of formSchema.
export type ReportFormValues = FormData & { consent: boolean };
export type LocationData = z.infer<typeof locationSchema>;
