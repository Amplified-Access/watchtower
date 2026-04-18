import z from "zod";

export const watcherIvitationSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(3, { message: "Name must be at least 3 characters" }),
  email: z.email({ message: "Email must be valid" }),
  organizationId: z.string().optional(),
});
