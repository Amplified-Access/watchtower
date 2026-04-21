import z from "zod";

export const formDefinitionSchema = z.object({
  title: z.string(),
  definition: z.any(),
  organizationId: z.string(),
});
