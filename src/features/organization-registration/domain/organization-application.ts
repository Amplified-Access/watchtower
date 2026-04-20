export interface OrganizationApplicationDraft {
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  website: string;
  certificateOfIncorporation?: string;
}

export interface OrganizationApplication {
  id: number;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  website: string | null;
  certificateOfIncorporation: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationEntity {
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
