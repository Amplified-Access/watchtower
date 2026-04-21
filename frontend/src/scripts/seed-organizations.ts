/**
 * Seed script for organizations data
 * Run this script to create sample organizations
 */

import "dotenv/config";

import { db } from "../db/index";
import { organizations } from "../db/schemas/organizations";
import { eq } from "drizzle-orm";

async function seedOrganizations() {
  console.log("🌱 Seeding organizations data...");

  try {
    const existingOrgs = await db.select().from(organizations);
    console.log(`Found ${existingOrgs.length} existing organizations`);

    if (existingOrgs.length > 0) {
      await db
        .update(organizations)
        .set({
          description:
            "Kenya's leading independent governance and accountability research organization. We monitor corruption, electoral integrity, and abuse of public office, publishing evidence-based reports used by civil society, media, and oversight bodies.",
          website: "https://africog.org",
          location: "Nairobi, Kenya",
          contactEmail: "info@africog.org",
        })
        .where(eq(organizations.id, existingOrgs[0].id));

      console.log("✅ Updated first organization with Africa Centre for Open Governance data");
    }

    const organizationsData = [
      {
        name: "Kenya Human Rights Commission",
        slug: "kenya-human-rights-commission",
        description:
          "A leading Kenyan human rights organization that documents and responds to police misconduct, arbitrary detention, torture in custody, and state violence. KHRC conducts investigations, publishes reports, and provides legal support to victims of security force abuses across all 47 counties.",
        website: "https://khrc.or.ke",
        location: "Nairobi, Kenya",
        contactEmail: "admin@khrc.or.ke",
      },
      {
        name: "Uganda Human Rights Commission",
        slug: "uganda-human-rights-commission",
        description:
          "Uganda's constitutional human rights body mandated to investigate violations including police brutality, unlawful detention, abuse of authority, and electoral malpractice. Receives and adjudicates individual complaints and produces annual state-of-human-rights reports.",
        website: "https://uhrc.ug",
        location: "Kampala, Uganda",
        contactEmail: "uhrc@uhrc.ug",
      },
      {
        name: "Tanzania Human Rights Defenders Coalition",
        slug: "thrdc",
        description:
          "A national coalition of over 300 civil society organizations monitoring human rights conditions in Tanzania. Documents incidents of police misconduct, suppression of public demonstrations, election irregularities, and abuse of public office by state officials.",
        website: "https://thrdc.or.tz",
        location: "Dar es Salaam, Tanzania",
        contactEmail: "info@thrdc.or.tz",
      },
      {
        name: "Ethiopian Human Rights Commission",
        slug: "ethiopian-human-rights-commission",
        description:
          "Ethiopia's independent constitutional human rights institution monitoring state conduct, security force behavior, and civil liberties. Publishes thematic reports on protest crackdowns, detention conditions, election environments, and misuse of government authority.",
        website: "https://www.ehrc.org.et",
        location: "Addis Ababa, Ethiopia",
        contactEmail: "info@ehrc.org.et",
      },
      {
        name: "Rwanda Civil Society Platform",
        slug: "rwanda-civil-society-platform",
        description:
          "An umbrella body coordinating over 170 Rwandan civil society organizations working on governance accountability, community petitions, and civic participation. Serves as a liaison between citizen grievances and government institutions, facilitating formal petitioning processes.",
        website: "https://rcsp.rw",
        location: "Kigali, Rwanda",
        contactEmail: "info@rcsp.rw",
      },
    ];

    const createdOrgs = await db
      .insert(organizations)
      .values(organizationsData)
      .onConflictDoNothing()
      .returning();
    console.log(`✅ Upserted ${createdOrgs.length} organizations`);

    console.log("🎉 Organizations seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding organizations:", error);
    throw error;
  }
}

seedOrganizations()
  .then(() => {
    console.log("✨ Organizations seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Organizations seeding process failed:", error);
    process.exit(1);
  });
