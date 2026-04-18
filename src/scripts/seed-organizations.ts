/**
 * Seed script for organizations data
 * Run this script to create sample organizations
 */

// Load environment variables
import "dotenv/config";

import { db } from "../db/index";
import { organizations } from "../db/schemas/organizations";
import { eq } from "drizzle-orm";

async function seedOrganizations() {
  console.log("🌱 Seeding organizations data...");

  try {
    // Get existing organizations
    const existingOrgs = await db.select().from(organizations);
    console.log(`Found ${existingOrgs.length} existing organizations`);

    if (existingOrgs.length > 0) {
      // Update the first organization with sample data
      await db
        .update(organizations)
        .set({
          description:
            "A leading digital rights organization working to protect and promote human rights in the digital age across East Africa.",
          website: "https://example-org.com",
          location: "Nairobi, Kenya",
          contactEmail: "volunteers@example-org.com",
        })
        .where(eq(organizations.id, existingOrgs[0].id));

      console.log("✅ Updated first organization with sample data");
    }

    // Add sample organizations
    console.log("Creating sample organizations...");
    const organizationsData = [
      {
        name: "Tech for Good Initiative",
        slug: "tech-for-good-initiative",
        description:
          "Empowering communities through technology and digital literacy programs. We focus on building capacity in underserved communities and creating sustainable tech solutions.",
        website: "https://techforgood.org",
        location: "Kampala, Uganda",
        contactEmail: "volunteers@techforgood.org",
      },
      {
        name: "Civic Engagement Platform",
        slug: "civic-engagement-platform",
        description:
          "Building digital tools to enhance citizen participation in governance and democracy. Our mission is to make government more transparent and accessible.",
        website: "https://civicplatform.org",
        location: "Dar es Salaam, Tanzania",
        contactEmail: "info@civicplatform.org",
      },
      {
        name: "Data Privacy Alliance",
        slug: "data-privacy-alliance",
        description:
          "Advocating for strong data protection laws and digital privacy rights. We work with policymakers and communities to ensure digital rights are protected.",
        website: "https://dataprivacy.org",
        location: "Kigali, Rwanda",
        contactEmail: "hello@dataprivacy.org",
      },
      {
        name: "Open Source Africa",
        slug: "open-source-africa",
        description:
          "Promoting open source software development and digital innovation across the African continent. We support developers and tech entrepreneurs.",
        website: "https://opensourceafrica.org",
        location: "Lagos, Nigeria",
        contactEmail: "community@opensourceafrica.org",
      },
      {
        name: "Digital Rights Foundation",
        slug: "digital-rights-foundation",
        description:
          "A research and advocacy organization focused on internet freedom, digital security, and online civil liberties in emerging democracies.",
        website: "https://digitalrights.foundation",
        location: "Accra, Ghana",
        contactEmail: "contact@digitalrights.foundation",
      },
    ];

    const createdOrgs = await db
      .insert(organizations)
      .values(organizationsData)
      .returning();
    console.log(`✅ Created ${createdOrgs.length} sample organizations`);

    console.log("🎉 Organizations seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding organizations:", error);
    throw error;
  }
}

// Run the seeding
seedOrganizations()
  .then(() => {
    console.log("✨ Organizations seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Organizations seeding process failed:", error);
    process.exit(1);
  });
