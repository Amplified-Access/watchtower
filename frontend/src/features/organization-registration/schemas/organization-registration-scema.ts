import { z } from "zod";

export const organizationApplicationSchema = z.object({
  organizationName: z.string().min(1, { message: "required" }),
  applicantName: z.string().min(1, { message: "required" }),
  applicantEmail: z.string().email({ message: "invalid" }),
  website: z
    .string()
    .min(1, { message: "required" }),

  certificateOfIncorporation: z.string().optional(),
  // applicationData: z.record(z.any()).optional(),
  // status: z.enum(["pending", "approved", "rejected"]).optional(),
});
