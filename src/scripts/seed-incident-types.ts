import "dotenv/config";
import { db } from "@/db";
import { incidentTypes } from "@/db/schemas/incident-types";
import { eq } from "drizzle-orm";

const existingIncidentTypes = [
  {
    name: "Public demonstrations",
    description:
      "Organized public gatherings, protests, marches, and demonstrations by citizens exercising their right to peaceful assembly.",
  },
  {
    name: "Election Irregularities",
    description:
      "Instances of electoral misconduct, voter intimidation, ballot tampering, and other violations of democratic electoral processes.",
  },
  {
    name: "Abuse of office",
    description:
      "Misuse of official authority or position for personal gain, including corruption, nepotism, and unauthorized use of government resources.",
  },
  {
    name: "Community petitions",
    description:
      "Formal collective requests or appeals submitted by community members to authorities regarding local issues and concerns.",
  },
  {
    name: "Police misconduct",
    description:
      "Inappropriate actions by law enforcement officers including excessive force, harassment, unlawful detention, and other violations of citizens' rights.",
  },
  {
    name: "Misuse of public funds",
    description:
      "Improper allocation, embezzlement, or fraudulent use of government resources and taxpayer money intended for public benefit.",
  },
];

async function seedIncidentTypes() {
  console.log("🌱 Seeding incident types...");

  try {
    for (const incidentType of existingIncidentTypes) {
      // Check if incident type already exists
      const existing = await db
        .select()
        .from(incidentTypes)
        .where(eq(incidentTypes.name, incidentType.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(incidentTypes).values({
          name: incidentType.name,
          description: incidentType.description,
          isActive: true,
        });
        console.log(`✅ Created incident type: ${incidentType.name}`);
      } else {
        console.log(`⏭️  Incident type already exists: ${incidentType.name}`);
      }
    }

    console.log("🎉 Incident types seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding incident types:", error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedIncidentTypes()
    .then(() => {
      console.log("Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export { seedIncidentTypes };
