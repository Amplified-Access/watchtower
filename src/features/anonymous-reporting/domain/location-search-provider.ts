import type { LocationData } from "../schemas/anonymous-incident-reproting-form-schema";

export interface LocationSearchProvider {
  search(searchTerm: string): Promise<LocationData[]>;
}
