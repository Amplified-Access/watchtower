import type { LocationSearchProvider } from "../../domain/location-search-provider";
import type { LocationData } from "../../schemas/anonymous-incident-reproting-form-schema";

export class LocationIqLocationSearchProvider implements LocationSearchProvider {
  async search(searchTerm: string): Promise<LocationData[]> {
    const apiKey = process.env.LOCATION_IQ_API_KEY;
    const preparedSearchTerm = encodeURIComponent(searchTerm);

    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${preparedSearchTerm}&format=json`,
    );

    return response.json();
  }
}
