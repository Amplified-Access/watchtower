import { api } from "./client";

export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  isPublic: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  license?: string;
  version?: string;
  coverage?: string;
  format?: string;
  keywords?: string[];
  methodology?: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  sortOrder?: string;
}

export const datasetsApi = {
  getPublicDatasets: (params?: ListParams, category?: string) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    if (category) query.set("category", category);
    const qs = query.toString();
    return api.get<Dataset[]>(`/datasets${qs ? `?${qs}` : ""}`);
  },

  getDatasetById: (id: string) => api.get<Dataset>(`/datasets/${id}`),

  getCategories: () => api.get<string[]>("/datasets/categories"),

  incrementDownload: (id: string) =>
    api.post(`/datasets/${id}/download`),

  getAllDatasets: (params?: ListParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Dataset[]>(`/superadmin/datasets${qs ? `?${qs}` : ""}`);
  },

  createDataset: (data: {
    title: string;
    description: string;
    category: string;
    fileKey: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    format: string;
    tags?: string[];
    keywords?: string[];
    source?: string;
    license?: string;
    coverage?: string;
    methodology?: string;
    isPublic: boolean;
  }) => api.post("/superadmin/datasets", data),

  deleteDataset: (id: string) => api.delete(`/superadmin/datasets/${id}`),
};
