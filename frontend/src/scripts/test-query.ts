import "dotenv/config";
import { db } from "../db";
import { incidentTypes } from "../db/schemas/incident-types";
import { organizationIncidentReports } from "../db/schemas/organization-incident-reports";
import { and, eq, sql, sum, count } from "drizzle-orm";

async function testQuery() {
  console.log("🔍 Testing query with category: 'intimidation_threats'\n");

  const eastAfricanCountries = [
    "Kenya",
    "Uganda",
    "Tanzania",
    "Rwanda",
    "Ethiopia",
    "Djibouti",
    "Eritrea",
  ];

  try {
    const organizationConditions = [
      // Filter to only East African countries using the country field
      sql`LOWER(${
        organizationIncidentReports.location
      } ->> 'country') IN (${sql.raw(
        eastAfricanCountries.map((c) => `'${c.toLowerCase()}'`).join(","),
      )})`,
      // Use case-insensitive matching for incident type names
      sql`LOWER(${incidentTypes.name}) = LOWER(${"intimidation_threats"})`,
    ];

    const orgReports = await db
      .select({
        region: sql`${organizationIncidentReports.location} ->> 'region'`,
        country: sql`${organizationIncidentReports.location} ->> 'country'`,
        totalFatalities: sum(organizationIncidentReports.fatalities),
        totalInjuries: sum(organizationIncidentReports.injuries),
        totalReports: count(organizationIncidentReports.id),
        lat: sql`CAST(${organizationIncidentReports.location} ->> 'lat' AS DOUBLE PRECISION)`,
        lon: sql`CAST(${organizationIncidentReports.location} ->> 'lon' AS DOUBLE PRECISION)`,
        displayName: sql`COALESCE(NULLIF(${organizationIncidentReports.location} ->> 'admin1', ''), ${organizationIncidentReports.location} ->> 'country')`,
        incidentTypes: sql`string_agg(DISTINCT ${incidentTypes.name}, ', ')`,
        incidentTypeDescriptions: sql`string_agg(DISTINCT ${incidentTypes.description}, ' | ')`,
        incidentTypeColor: sql`MAX(${incidentTypes.color})`,
        source: sql`'organization'`,
      })
      .from(organizationIncidentReports)
      .leftJoin(
        incidentTypes,
        eq(organizationIncidentReports.incidentTypeId, incidentTypes.id),
      )
      .where(and(...organizationConditions))
      .groupBy(
        sql`${organizationIncidentReports.location} ->> 'region'`,
        sql`${organizationIncidentReports.location} ->> 'country'`,
        sql`${organizationIncidentReports.location} ->> 'lat'`,
        sql`${organizationIncidentReports.location} ->> 'lon'`,
        sql`COALESCE(NULLIF(${organizationIncidentReports.location} ->> 'admin1', ''), ${organizationIncidentReports.location} ->> 'country')`,
      );

    console.log("✅ Query Results:");
    console.log(JSON.stringify(orgReports, null, 2));
    console.log(`\n📊 Total reports found: ${orgReports.length}`);

    if (orgReports.length === 0) {
      console.log("\n🔍 Let's check what's in the database...\n");

      // Check the incident type
      const incidentType = await db
        .select()
        .from(incidentTypes)
        .where(eq(incidentTypes.name, "intimidation_threats"))
        .limit(1);

      console.log("Incident type:", incidentType);

      // Check raw reports
      const rawReports = await db
        .select()
        .from(organizationIncidentReports)
        .where(
          eq(
            organizationIncidentReports.incidentTypeId,
            "a71f8831-aa35-4eb9-8594-4f7c5ea34a30",
          ),
        );

      console.log("\nRaw reports:", JSON.stringify(rawReports, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

testQuery();
