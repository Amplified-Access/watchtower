import { db } from "@/db";
import { datasets } from "@/db/schemas/datasets";

async function seedDatasets() {
  console.log("🌱 Seeding datasets...");

  const sampleDatasets = [
    {
      title: "East Africa Conflict Incidents 2024",
      description:
        "Comprehensive dataset of conflict incidents across East Africa including battles, violence against civilians, and other security events. Data is collected from multiple verified sources and updated monthly.",
      category: "Conflict",
      tags: ["conflict", "security", "east-africa", "2024"],
      fileKey: "sample-conflict-data.csv", // This would be a real file key in production
      fileName: "east-africa-conflict-2024.csv",
      fileSize: 2500000, // 2.5MB
      fileType: "text/csv",
      format: "CSV",
      source: "Watchtower Conflict Monitoring",
      license: "CC BY 4.0",
      version: "1.2",
      coverage: "East Africa (2024)",
      keywords: [
        "conflict",
        "incidents",
        "east-africa",
        "security",
        "monitoring",
      ],
      methodology:
        "Data collected through field reporting, media monitoring, and partner organizations. All incidents are verified through multiple sources before inclusion.",
      isPublic: true,
    },
    {
      title: "Uganda Population Demographics",
      description:
        "Detailed demographic data for Uganda including population distribution by age, gender, and region. Based on latest census data and UN population estimates.",
      category: "Demographics",
      tags: ["uganda", "population", "demographics", "census"],
      fileKey: "uganda-demographics.json",
      fileName: "uganda-demographics-2024.json",
      fileSize: 850000, // 850KB
      fileType: "application/json",
      format: "JSON",
      source: "Uganda Bureau of Statistics",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Uganda (2024)",
      keywords: [
        "demographics",
        "population",
        "uganda",
        "census",
        "statistics",
      ],
      methodology:
        "Data compiled from national census, household surveys, and demographic health surveys conducted by national statistical offices.",
      isPublic: true,
    },
    {
      title: "Economic Indicators East Africa",
      description:
        "Key economic indicators for East African countries including GDP, inflation rates, trade data, and employment statistics. Updated quarterly.",
      category: "Economic",
      tags: ["economics", "gdp", "trade", "east-africa"],
      fileKey: "economic-indicators.xlsx",
      fileName: "east-africa-economic-indicators-2024.xlsx",
      fileSize: 1200000, // 1.2MB
      fileType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      format: "Excel",
      source: "World Bank, IMF, National Statistical Offices",
      license: "CC BY 4.0",
      version: "2.1",
      coverage: "East Africa (Q1-Q3 2024)",
      keywords: [
        "economics",
        "gdp",
        "inflation",
        "trade",
        "employment",
        "statistics",
      ],
      methodology:
        "Economic data compiled from World Bank databases, IMF reports, and national statistical offices. Data is standardized and validated for consistency.",
      isPublic: true,
    },
    {
      title: "Health Facility Mapping Kenya",
      description:
        "Comprehensive mapping of health facilities across Kenya including location coordinates, facility types, services offered, and capacity data.",
      category: "Health",
      tags: ["health", "facilities", "kenya", "mapping"],
      fileKey: "kenya-health-facilities.csv",
      fileName: "kenya-health-facilities-2024.csv",
      fileSize: 3200000, // 3.2MB
      fileType: "text/csv",
      format: "CSV",
      source: "Kenya Ministry of Health",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya (2024)",
      keywords: [
        "health",
        "facilities",
        "hospitals",
        "clinics",
        "healthcare",
        "mapping",
      ],
      methodology:
        "Data collected through facility surveys, administrative records, and GPS mapping conducted by the Ministry of Health and partner organizations.",
      isPublic: true,
    },
    {
      title: "Environmental Monitoring Dataset",
      description:
        "Environmental monitoring data including air quality, water quality, and deforestation metrics across the region. Contains satellite imagery analysis and ground-based measurements.",
      category: "Environmental",
      tags: ["environment", "monitoring", "air-quality", "deforestation"],
      fileKey: "environmental-monitoring.json",
      fileName: "environmental-monitoring-2024.json",
      fileSize: 4500000, // 4.5MB
      fileType: "application/json",
      format: "JSON",
      source: "Environmental Monitoring Consortium",
      license: "CC BY 4.0",
      version: "1.3",
      coverage: "East Africa (2024)",
      keywords: [
        "environment",
        "air-quality",
        "water-quality",
        "deforestation",
        "satellite",
        "monitoring",
      ],
      methodology:
        "Combines satellite imagery analysis with ground-based sensor data. Data is processed using standardized environmental monitoring protocols.",
      isPublic: true,
    },
    {
      title: "Education Access Analysis",
      description:
        "Analysis of education access and outcomes across the region including enrollment rates, literacy statistics, and infrastructure data. Focus on gender and rural-urban disparities.",
      category: "Social",
      tags: ["education", "access", "literacy", "gender"],
      fileKey: "education-analysis.pdf",
      fileName: "education-access-analysis-2024.pdf",
      fileSize: 2800000, // 2.8MB
      fileType: "application/pdf",
      format: "PDF",
      source: "Education Research Initiative",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "East Africa (2024)",
      keywords: [
        "education",
        "literacy",
        "enrollment",
        "gender",
        "rural",
        "urban",
        "access",
      ],
      methodology:
        "Analysis based on household surveys, school administrative data, and field research. Uses standardized education indicators and methodology.",
      isPublic: true,
    },
  ];

  try {
    for (const dataset of sampleDatasets) {
      await db.insert(datasets).values(dataset);
      console.log(`✅ Created dataset: ${dataset.title}`);
    }

    console.log(`🎉 Successfully seeded ${sampleDatasets.length} datasets!`);
  } catch (error) {
    console.error("❌ Error seeding datasets:", error);
    throw error;
  }
}

// Run the seeding
seedDatasets()
  .then(() => {
    console.log("✨ Datasets seeding process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
