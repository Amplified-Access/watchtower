export interface DatasetRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[] | null;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadCount: number | null;
  isPublic: boolean | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  source: string | null;
  license: string | null;
  version: string | null;
  coverage: string | null;
  format: string;
  keywords: string[] | null;
  methodology: string | null;
}

export interface DatasetFilterInput {
  category?: string;
  search?: string;
  tags?: string[];
  format?: string;
  page: number;
  limit: number;
}

export interface AdminDatasetFilterInput extends DatasetFilterInput {
  includePrivate: boolean;
}

export interface DatasetUploadInput {
  title: string;
  description: string;
  category: string;
  tags: string[];
  source?: string;
  license: string;
  version: string;
  coverage?: string;
  format: string;
  keywords: string[];
  methodology?: string;
  isPublic: boolean;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface DatasetUpdateInput {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  source?: string;
  license?: string;
  version?: string;
  coverage?: string;
  format?: string;
  keywords?: string[];
  methodology?: string;
  isPublic?: boolean;
}

export interface DatasetCategoryStat {
  category: string;
  count: number;
}
