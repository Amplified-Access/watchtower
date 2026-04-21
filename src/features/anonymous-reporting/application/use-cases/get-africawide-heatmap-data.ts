import type { AnonymousReportingRepository } from "../../domain/anonymous-reporting-repository";

export class GetAfricawideHeatmapData {
  constructor(private readonly repository: AnonymousReportingRepository) {}

  async execute() {
    const data = await this.repository.getAfricawideHeatmapData();

    return {
      success: true,
      message: "Successfully fetched africawide heatmap data",
      data,
    };
  }
}
