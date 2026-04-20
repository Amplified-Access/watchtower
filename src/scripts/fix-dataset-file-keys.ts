import "dotenv/config";
import { db } from "@/db";
import { datasets } from "@/db/schemas/datasets";
import { eq } from "drizzle-orm";

const fileKeyFixes: Record<string, string> = {
  "acled-east-africa-2020-2025.csv": "https://acleddata.com/data-export-tool/",
  "carnegie-protest-tracker-africa.json": "https://carnegieendowment.org/features/global-protest-tracker",
  "apcof-police-accountability-africa.xlsx": "https://apcof.org/publications/",
  "gcb-africa-2019-microdata.csv": "https://www.transparency.org/en/gcb/africa/africa-2019",
  "afrobarometer-rounds-7-9-merged.csv": "https://www.afrobarometer.org/online-data-analysis",
  "oag-kenya-audit-reports-2019-2024.json": "https://www.oagkenya.go.ke/reports/",
  "worldbank-boost-east-africa-spending.xlsx": "https://www.worldbank.org/en/programs/boost-portal",
  "obs-east-africa-2012-2023.csv": "https://internationalbudget.org/open-budget-survey/",
  "nelda-east-africa-horn-1945-2024.csv": "https://nelda.co/",
  "eisa-eom-reports-east-southern-africa.json": "https://www.eisa.org/publications/eor/",
  "iiag-full-dataset-2013-2023.xlsx": "https://iiag.online/data.html",
  "caj-kenya-complaints-2015-2024.csv": "https://www.ombudsman.go.ke/reports/",
  "kikasha-petitions-kenya-2021-2025.json": "https://kikasha.com/petitions",
};

async function fixDatasetFileKeys() {
  console.log("🔧 Fixing dataset fileKeys to use external URLs...");

  for (const [oldKey, newKey] of Object.entries(fileKeyFixes)) {
    const result = await db
      .update(datasets)
      .set({ fileKey: newKey })
      .where(eq(datasets.fileKey, oldKey))
      .returning({ title: datasets.title });

    if (result.length > 0) {
      console.log(`✅ Fixed: ${result[0].title}`);
    } else {
      console.log(`⚠️  No row found for key: ${oldKey}`);
    }
  }

  console.log("🎉 Done!");
}

fixDatasetFileKeys()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
