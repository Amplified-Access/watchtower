import { LocationSearchFailedError } from "../../domain/errors";
import type { LocationSearchProvider } from "../../domain/location-search-provider";

export class SearchLocation {
  constructor(private readonly provider: LocationSearchProvider) {}

  async execute(searchTerm: string) {
    const data = await this.provider.search(searchTerm);

    if (!data) {
      throw new LocationSearchFailedError();
    }

    return {
      success: true,
      message: "Successfully found places",
      data,
    };
  }
}
