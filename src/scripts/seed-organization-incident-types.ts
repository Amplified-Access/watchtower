import "dotenv/config";
import { db } from "../db";
import { organizationIncidentTypes } from "../db/schemas/organization-incident-types";
import { incidentTypes } from "../db/schemas/incident-types";
import { organizations } from "../db/schemas/organizations";

async function seedOrganizationIncidentTypes() {
  console.log("🌱 Seeding organization incident types...");

  try {
    // Get all organizations and incident types
    const [allOrganizations, allIncidentTypes] = await Promise.all([
      db.select().from(organizations),
      db.select().from(incidentTypes),
    ]);

    console.log(
      `Found ${allOrganizations.length} organizations and ${allIncidentTypes.length} incident types`
    );

    if (allOrganizations.length === 0 || allIncidentTypes.length === 0) {
      console.log(
        "❌ No organizations or incident types found. Please seed those first."
      );
      return;
    }

    // Enable first 3-5 incident types for each organization (to simulate different organizations enabling different types)
    for (const org of allOrganizations) {
      // Each organization gets a different subset of incident types
      const typesToEnable = allIncidentTypes.slice(
        0,
        Math.min(5, allIncidentTypes.length)
      );

      for (const incidentType of typesToEnable) {
        try {
          await db
            .insert(organizationIncidentTypes)
            .values({
              organizationId: org.id,
              incidentTypeId: incidentType.id,
              isEnabled: true,
            })
            .onConflictDoNothing(); // In case it already exists

          console.log(
            `✅ Enabled "${incidentType.name}" for organization "${org.name}"`
          );
        } catch (error) {
          console.log(
            `⚠️ Skipped "${incidentType.name}" for "${org.name}" (probably already exists)`
          );
        }
      }
    }

    console.log("✅ Organization incident types seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding organization incident types:", error);
  }
}

// Run the seeding function
seedOrganizationIncidentTypes()
  .then(() => {
    console.log("🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
