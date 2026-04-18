import "dotenv/config";
import { db } from "../db";
import { incidentTypes } from "../db/schemas/incident-types";
import { organizationIncidentReports } from "../db/schemas/organization-incident-reports";
import { eq } from "drizzle-orm";

async function debugIncidentType() {
  console.log(
    "🔍 Debugging incident type for ID: a71f8831-aa35-4eb9-8594-4f7c5ea34a30\n"
  );

  try {
    // Get the incident type
    const incidentType = await db
      .select()
      .from(incidentTypes)
      .where(eq(incidentTypes.id, "a71f8831-aa35-4eb9-8594-4f7c5ea34a30"))
      .limit(1);

    if (incidentType.length > 0) {
      console.log("✅ Found incident type:");
      console.log(JSON.stringify(incidentType[0], null, 2));
      console.log("\n📝 Name:", incidentType[0].name);
      console.log("📝 Lowercase:", incidentType[0].name.toLowerCase());
      console.log(
        "📝 Slug would be:",
        incidentType[0].name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    } else {
      console.log("❌ No incident type found with that ID");
    }

    // Get the report
    console.log("\n🔍 Checking organization report...");
    const report = await db
      .select()
      .from(organizationIncidentReports)
      .where(
        eq(
          organizationIncidentReports.id,
          "26afb4ab-eb54-4b0f-a3f1-635829ab2668"
        )
      )
      .limit(1);

    if (report.length > 0) {
      console.log("✅ Found report:");
      console.log("Location:", report[0].location);
      console.log("Incident Type ID:", report[0].incidentTypeId);
    } else {
      console.log("❌ No report found");
    }

    // List all incident types
    console.log("\n📋 All incident types in database:");
    const allTypes = await db.select().from(incidentTypes);
    allTypes.forEach((type) => {
      console.log(`- ${type.name} (ID: ${type.id})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

debugIncidentType();
