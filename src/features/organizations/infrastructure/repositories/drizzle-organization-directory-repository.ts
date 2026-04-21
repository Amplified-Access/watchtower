import { db } from "@/db";
import { organizations } from "@/db/schemas/organizations";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import type { OrganizationDirectoryRepository } from "../../domain/organization-directory-repository";
import type {
  GetPublicOrganizationsInput,
  PublicOrganizationDetails,
  PublicOrganizationItem,
  PublicOrganizationsResult,
} from "../../domain/organization-directory-types";

export class DrizzleOrganizationDirectoryRepository
  implements OrganizationDirectoryRepository
{
  async getPublicOrganizations(
    input: GetPublicOrganizationsInput,
  ): Promise<PublicOrganizationsResult> {
    const searchCondition = input.search
      ? ilike(organizations.name, `%${input.search}%`)
      : undefined;

    const organizationsQuery = db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        website: organizations.website,
        location: organizations.location,
        contactEmail: organizations.contactEmail,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    const rows: PublicOrganizationItem[] = searchCondition
      ? await organizationsQuery.where(searchCondition)
      : await organizationsQuery;

    const countQuery = db.select({ count: count() }).from(organizations);
    const [countRow] = searchCondition
      ? await countQuery.where(searchCondition)
      : await countQuery;

    const total = Number(countRow?.count ?? 0);

    return {
      organizations: rows,
      total,
      hasMore: input.offset + input.limit < total,
    };
  }

  async getOrganizationBySlug(slug: string): Promise<PublicOrganizationDetails | null> {
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        website: organizations.website,
        location: organizations.location,
        contactEmail: organizations.contactEmail,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    return organization ?? null;
  }
}
