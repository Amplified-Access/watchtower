/**
 * Seed script for insights data
 * Run this script to create sample insights and tags
 */

import "dotenv/config";
import { db } from "../db/index";
import {
  insights,
  insightTags,
  insightTagRelations,
} from "../db/schemas/insights";
import { user } from "../db/schemas/auth";

async function seedInsights() {
  console.log("🌱 Seeding insights data...");

  try {
    // Create some sample tags
    console.log("Creating insight tags...");
    const tagsData = [
      { title: "Digital Rights", slug: "digital-rights" },
      { title: "Civic Technology", slug: "civic-technology" },
      { title: "Data Privacy", slug: "data-privacy" },
      { title: "Social Impact", slug: "social-impact" },
      { title: "Community Engagement", slug: "community-engagement" },
      { title: "Policy", slug: "policy" },
      { title: "Innovation", slug: "innovation" },
      { title: "Research", slug: "research" },
    ];

    const createdTags = await db
      .insert(insightTags)
      .values(tagsData)
      .returning();
    console.log(`✅ Created ${createdTags.length} tags`);

    // Get the first user to assign as author
    const [firstUser] = await db.select().from(user).limit(1);

    if (!firstUser) {
      console.log("⚠️ No users found. Please create at least one user first.");
      return;
    }

    // Create sample insights
    console.log("Creating sample insights...");
    const insightsData = [
      {
        title: "The Future of Digital Rights in East Africa",
        slug: "future-digital-rights-east-africa",
        description:
          "Exploring the evolving landscape of digital rights across East African countries and the challenges communities face in protecting their online freedoms.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Digital rights have become increasingly important as East African countries continue to embrace digital transformation. This comprehensive analysis examines the current state of digital rights protection across the region.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Key Challenges" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "One of the primary challenges facing digital rights in East Africa is the lack of comprehensive legal frameworks that adequately protect citizens' online privacy and freedom of expression.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
        imageAlt: "Digital technology and connectivity in Africa",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        title: "Civic Technology Solutions for Local Governance",
        slug: "civic-tech-solutions-local-governance",
        description:
          "How innovative civic technology platforms are revolutionizing citizen engagement and transparency in local government processes.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Civic technology has emerged as a powerful tool for enhancing transparency and citizen participation in governance. This article explores successful implementations across the region.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
        imageAlt: "Citizens engaging with digital government services",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        title: "Data Privacy Best Practices for Civil Society Organizations",
        slug: "data-privacy-best-practices-cso",
        description:
          "Essential guidelines and practices for civil society organizations to protect sensitive data while maintaining operational effectiveness.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Civil society organizations handle sensitive data daily, from donor information to beneficiary details. This guide provides practical steps for implementing robust data protection measures.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop",
        imageAlt: "Data security and privacy protection",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        title: "Community-Driven Social Impact Measurement",
        slug: "community-driven-social-impact-measurement",
        description:
          "Innovative approaches to measuring social impact that put communities at the center of evaluation processes.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Traditional impact measurement often overlooks community perspectives. This research presents a framework for community-driven impact assessment that ensures authentic representation of outcomes.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
        imageAlt: "Community members participating in research",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        title: "Building Inclusive Digital Platforms",
        slug: "building-inclusive-digital-platforms",
        description:
          "Design principles and technical considerations for creating digital platforms that are accessible to all community members.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Digital inclusion requires intentional design choices that consider diverse user needs, from accessibility requirements to cultural preferences.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop",
        imageAlt: "Diverse group using digital technology",
        status: "draft" as const,
        publishedAt: null,
      },
    ];

    const createdInsights = await db
      .insert(insights)
      .values(insightsData)
      .returning();
    console.log(`✅ Created ${createdInsights.length} insights`);

    // Create tag relations
    console.log("Creating tag relations...");
    const tagRelations = [
      // Digital Rights + Policy
      { insightId: createdInsights[0].id, tagId: createdTags[0].id },
      { insightId: createdInsights[0].id, tagId: createdTags[5].id },

      // Civic Tech + Community Engagement
      { insightId: createdInsights[1].id, tagId: createdTags[1].id },
      { insightId: createdInsights[1].id, tagId: createdTags[4].id },

      // Data Privacy + Policy
      { insightId: createdInsights[2].id, tagId: createdTags[2].id },
      { insightId: createdInsights[2].id, tagId: createdTags[5].id },

      // Social Impact + Research
      { insightId: createdInsights[3].id, tagId: createdTags[3].id },
      { insightId: createdInsights[3].id, tagId: createdTags[7].id },

      // Innovation + Community Engagement
      { insightId: createdInsights[4].id, tagId: createdTags[6].id },
      { insightId: createdInsights[4].id, tagId: createdTags[4].id },
    ];

    await db.insert(insightTagRelations).values(tagRelations);
    console.log(`✅ Created ${tagRelations.length} tag relations`);

    console.log("🎉 Insights seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding insights:", error);
    throw error;
  }
}

// Run the seeding
seedInsights()
  .then(() => {
    console.log("✨ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });
