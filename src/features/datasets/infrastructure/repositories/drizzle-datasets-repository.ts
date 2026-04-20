import { db as defaultDb } from "@/db";
import { datasets } from "@/db/schemas/datasets";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  AdminDatasetFilterInput,
  DatasetCategoryStat,
  DatasetFilterInput,
  DatasetRecord,
  DatasetUpdateInput,
  DatasetUploadInput,
} from "../../domain/dataset";
import type { DatasetsRepository } from "../../domain/datasets-repository";

export class DrizzleDatasetsRepository implements DatasetsRepository {
  constructor(private readonly database = defaultDb) {}

  async getPublicDatasets(input: DatasetFilterInput) {
    const offset = (input.page - 1) * input.limit;
    const whereConditions: any[] = [eq(datasets.isPublic, true)];

    if (input.category) {
      whereConditions.push(eq(datasets.category, input.category));
    }

    if (input.format) {
      whereConditions.push(eq(datasets.format, input.format));
    }

    if (input.search) {
      whereConditions.push(
        or(
          ilike(datasets.title, `%${input.search}%`),
          ilike(datasets.description, `%${input.search}%`),
          ilike(datasets.source, `%${input.search}%`),
        ),
      );
    }

    const data = await this.database
      .select()
      .from(datasets)
      .where(and(...whereConditions))
      .orderBy(desc(datasets.publishedAt))
      .limit(input.limit)
      .offset(offset);

    const [{ count: totalCount }] = await this.database
      .select({ count: count() })
      .from(datasets)
      .where(and(...whereConditions));

    return {
      data: data as DatasetRecord[],
      total: Number(totalCount),
    };
  }

  async getDatasetById(id: string): Promise<DatasetRecord | null> {
    const [dataset] = await this.database
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.isPublic, true)));

    return (dataset as DatasetRecord) ?? null;
  }

  async incrementDownload(id: string): Promise<void> {
    await this.database
      .update(datasets)
      .set({
        downloadCount: sql`${datasets.downloadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, id));
  }

  async uploadDataset(input: DatasetUploadInput): Promise<DatasetRecord> {
    const [newDataset] = await this.database
      .insert(datasets)
      .values({
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags,
        fileKey: input.fileKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        source: input.source,
        license: input.license,
        version: input.version,
        coverage: input.coverage,
        format: input.format,
        keywords: input.keywords,
        methodology: input.methodology,
        isPublic: input.isPublic,
      })
      .returning();

    return newDataset as DatasetRecord;
  }

  async getAllDatasets(input: AdminDatasetFilterInput) {
    const offset = (input.page - 1) * input.limit;
    const whereConditions: any[] = [];

    if (!input.includePrivate) {
      whereConditions.push(eq(datasets.isPublic, true));
    }

    if (input.category) {
      whereConditions.push(eq(datasets.category, input.category));
    }

    if (input.format) {
      whereConditions.push(eq(datasets.format, input.format));
    }

    if (input.search) {
      whereConditions.push(
        or(
          ilike(datasets.title, `%${input.search}%`),
          ilike(datasets.description, `%${input.search}%`),
          ilike(datasets.source, `%${input.search}%`),
        ),
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const data = await this.database
      .select()
      .from(datasets)
      .where(whereClause)
      .orderBy(desc(datasets.createdAt))
      .limit(input.limit)
      .offset(offset);

    const [{ count: totalCount }] = await this.database
      .select({ count: count() })
      .from(datasets)
      .where(whereClause);

    return {
      data: data as DatasetRecord[],
      total: Number(totalCount),
    };
  }

  async updateDataset(input: DatasetUpdateInput): Promise<DatasetRecord | null> {
    const { id, ...updateData } = input;

    const [updated] = await this.database
      .update(datasets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, id))
      .returning();

    return (updated as DatasetRecord) ?? null;
  }

  async deleteDataset(id: string): Promise<DatasetRecord | null> {
    const [deleted] = await this.database
      .delete(datasets)
      .where(eq(datasets.id, id))
      .returning();

    return (deleted as DatasetRecord) ?? null;
  }

  async getCategoryStats(): Promise<DatasetCategoryStat[]> {
    const rows = await this.database
      .select({
        category: datasets.category,
        count: count(),
      })
      .from(datasets)
      .where(eq(datasets.isPublic, true))
      .groupBy(datasets.category)
      .orderBy(desc(count()));

    return rows.map((row) => ({
      category: row.category,
      count: Number(row.count),
    }));
  }
}
