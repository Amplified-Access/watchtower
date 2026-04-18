import { z } from "zod";

export const datasetUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()),
  source: z.string().optional(),
  license: z.string(),
  version: z.string(),
  coverage: z.string().optional(),
  format: z.string().min(1, "Format is required"),
  keywords: z.array(z.string()),
  methodology: z.string().optional(),
  isPublic: z.boolean(),
});

export const datasetUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  license: z.string().optional(),
  version: z.string().optional(),
  coverage: z.string().optional(),
  format: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  methodology: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const datasetFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  format: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
});

export type DatasetUpload = z.infer<typeof datasetUploadSchema>;
export type DatasetUpdate = z.infer<typeof datasetUpdateSchema>;
export type DatasetFilter = z.infer<typeof datasetFilterSchema>;
