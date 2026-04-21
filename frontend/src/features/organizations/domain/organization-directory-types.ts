export interface GetPublicOrganizationsInput {
  search?: string;
  limit: number;
  offset: number;
}

export interface PublicOrganizationItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  location: string | null;
  contactEmail: string | null;
  createdAt: Date;
}

export interface PublicOrganizationDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  location: string | null;
  contactEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicOrganizationsResult {
  organizations: PublicOrganizationItem[];
  total: number;
  hasMore: boolean;
}
