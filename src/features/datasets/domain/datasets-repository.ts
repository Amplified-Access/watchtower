import type {
  AdminDatasetFilterInput,
  DatasetCategoryStat,
  DatasetFilterInput,
  DatasetRecord,
  DatasetUpdateInput,
  DatasetUploadInput,
} from "./dataset";

export interface DatasetsRepository {
  getPublicDatasets(input: DatasetFilterInput): Promise<{
    data: DatasetRecord[];
    total: number;
  }>;
  getDatasetById(id: string): Promise<DatasetRecord | null>;
  incrementDownload(id: string): Promise<void>;
  uploadDataset(input: DatasetUploadInput): Promise<DatasetRecord>;
  getAllDatasets(input: AdminDatasetFilterInput): Promise<{
    data: DatasetRecord[];
    total: number;
  }>;
  updateDataset(input: DatasetUpdateInput): Promise<DatasetRecord | null>;
  deleteDataset(id: string): Promise<DatasetRecord | null>;
  getCategoryStats(): Promise<DatasetCategoryStat[]>;
}
