import { Suspense } from "react";
import ThematicMap from "@/features/maps/components/thematic-map";
import Loader from "@/components/common/loader";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { incidentTypes } from "@/db/schemas/incident-types";
import { anonymousIncidentReports } from "@/db/schemas/anonymous-incident-reports";
import { organizationIncidentReports } from "@/db/schemas/organization-incident-reports";
import { eq, and, count, sql } from "drizzle-orm";

// Helper function to generate URL-friendly slug from incident type name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "") // Keep underscores, spaces, and hyphens temporarily
    .replace(/[\s_]+/g, "-") // Replace spaces AND underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
};

// Helper function to convert slug back to potential incident type names
const slugToSearchTerms = (slug: string): string[] => {
  const variations = [
    slug.replace(/-/g, "_"), // Try with underscores first (for DB names like "intimidation_threats")
    slug, // Try exact slug
    slug.replace(/-/g, " "), // Replace hyphens with spaces
    slug.replace("remote violence", "remote violence"),
    slug.replace("explosions", "explosions/remote violence"),
  ];

  // Remove duplicates
  return [...new Set(variations)];
};

interface DynamicMapPageProps {
  params: Promise<{ slug: string }>;
}

const DynamicMapPage = async ({ params }: DynamicMapPageProps) => {
  const { slug } = await params;

  // Get potential search terms for this slug
  const searchTerms = slugToSearchTerms(slug);

  // Find matching incident type in database (include types with reports from either source)
  let incidentType = null;

  for (const searchTerm of searchTerms) {
    const results = await db
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      })
      .from(incidentTypes)
      .leftJoin(
        anonymousIncidentReports,
        eq(incidentTypes.id, anonymousIncidentReports.incidentTypeId)
      )
      .leftJoin(
        organizationIncidentReports,
        eq(incidentTypes.id, organizationIncidentReports.incidentTypeId)
      )
      .where(
        and(
          eq(incidentTypes.isActive, true),
          eq(incidentTypes.name, searchTerm)
        )
      )
      .groupBy(
        incidentTypes.id,
        incidentTypes.name,
        incidentTypes.description,
        incidentTypes.isActive,
        incidentTypes.createdAt,
        incidentTypes.updatedAt
      )
      .having(
        sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id}) > 0`
      )
      .limit(1);

    if (results.length > 0) {
      incidentType = results[0];
      break;
    }
  }

  // If no exact match, try case-insensitive search among types with reports
  if (!incidentType) {
    const allTypesWithReports = await db
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        description: incidentTypes.description,
        isActive: incidentTypes.isActive,
        createdAt: incidentTypes.createdAt,
        updatedAt: incidentTypes.updatedAt,
      })
      .from(incidentTypes)
      .leftJoin(
        anonymousIncidentReports,
        eq(incidentTypes.id, anonymousIncidentReports.incidentTypeId)
      )
      .leftJoin(
        organizationIncidentReports,
        eq(incidentTypes.id, organizationIncidentReports.incidentTypeId)
      )
      .where(eq(incidentTypes.isActive, true))
      .groupBy(
        incidentTypes.id,
        incidentTypes.name,
        incidentTypes.description,
        incidentTypes.isActive,
        incidentTypes.createdAt,
        incidentTypes.updatedAt
      )
      .having(
        sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id}) > 0`
      );

    incidentType = allTypesWithReports.find(
      (type) => generateSlug(type.name) === slug
    );
  }

  // If still no match, show 404
  if (!incidentType) {
    notFound();
  }

  return (
    <section>
      <Suspense
        fallback={
          <div className="w-full h-screen grid place-items-center">
            <Loader className="text-dark" size="24" />
          </div>
        }
      >
        <ThematicMap
          theme={incidentType.name}
          title={`${incidentType.name} Map`}
          description={
            incidentType.description ||
            `Mapping incidents related to ${incidentType.name.toLowerCase()}`
          }
        />
      </Suspense>
    </section>
  );
};

export default DynamicMapPage;

// Generate static params for incident types with reports at build time
export async function generateStaticParams() {
  try {
    // Get all incident types that are active and have any reports (anonymous or organization)
    const incidentTypesWithReports = await db
      .select({
        id: incidentTypes.id,
        name: incidentTypes.name,
        anonymousReportCount: sql`COUNT(DISTINCT ${anonymousIncidentReports.id})`,
        organizationReportCount: sql`COUNT(DISTINCT ${organizationIncidentReports.id})`,
        totalReportCount: sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id})`,
      })
      .from(incidentTypes)
      .leftJoin(
        anonymousIncidentReports,
        eq(incidentTypes.id, anonymousIncidentReports.incidentTypeId)
      )
      .leftJoin(
        organizationIncidentReports,
        eq(incidentTypes.id, organizationIncidentReports.incidentTypeId)
      )
      .where(eq(incidentTypes.isActive, true))
      .groupBy(incidentTypes.id, incidentTypes.name)
      .having(
        sql`COUNT(DISTINCT ${anonymousIncidentReports.id}) + COUNT(DISTINCT ${organizationIncidentReports.id}) > 0`
      );

    return incidentTypesWithReports.map((type) => ({
      slug: generateSlug(type.name),
    }));
  } catch (error) {
    console.error("Error generating static params for dynamic maps:", error);
    return [];
  }
}
