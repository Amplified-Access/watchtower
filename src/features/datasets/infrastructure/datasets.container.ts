import { DeleteDataset } from "../application/use-cases/delete-dataset";
import { GetAllDatasets } from "../application/use-cases/get-all-datasets";
import { GetDatasetById } from "../application/use-cases/get-dataset-by-id";
import { GetDatasetCategories } from "../application/use-cases/get-dataset-categories";
import { GetPublicDatasets } from "../application/use-cases/get-public-datasets";
import { IncrementDatasetDownload } from "../application/use-cases/increment-dataset-download";
import { UpdateDataset } from "../application/use-cases/update-dataset";
import { UploadDataset } from "../application/use-cases/upload-dataset";
import type { DatasetsRepository } from "../domain/datasets-repository";
import { DrizzleDatasetsRepository } from "./repositories/drizzle-datasets-repository";

export interface DatasetsUseCases {
  getPublicDatasets: GetPublicDatasets;
  getDatasetById: GetDatasetById;
  incrementDatasetDownload: IncrementDatasetDownload;
  uploadDataset: UploadDataset;
  getAllDatasets: GetAllDatasets;
  updateDataset: UpdateDataset;
  deleteDataset: DeleteDataset;
  getDatasetCategories: GetDatasetCategories;
}

export const createDatasetsUseCases = (
  repository: DatasetsRepository = new DrizzleDatasetsRepository(),
): DatasetsUseCases => {
  return {
    getPublicDatasets: new GetPublicDatasets(repository),
    getDatasetById: new GetDatasetById(repository),
    incrementDatasetDownload: new IncrementDatasetDownload(repository),
    uploadDataset: new UploadDataset(repository),
    getAllDatasets: new GetAllDatasets(repository),
    updateDataset: new UpdateDataset(repository),
    deleteDataset: new DeleteDataset(repository),
    getDatasetCategories: new GetDatasetCategories(repository),
  };
};
