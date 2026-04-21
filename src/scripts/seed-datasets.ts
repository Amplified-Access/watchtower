import "dotenv/config";
import { db } from "@/db";
import { datasets } from "@/db/schemas/datasets";

async function seedDatasets() {
  console.log("🌱 Seeding datasets...");

  const sampleDatasets = [
    {
      title: "ACLED Political Violence & Protest Data — East Africa 2020–2025",
      description:
        "Near-real-time coded data on political violence and protest events across Kenya, Uganda, Tanzania, Ethiopia, and Rwanda. Includes event type, actors, fatalities, precise location coordinates, and source citations. Sourced from the Armed Conflict Location & Event Data Project (ACLED), the highest-quality global source for political disorder data.",
      category: "Conflict",
      tags: ["protests", "political-violence", "east-africa", "acled", "demonstrations"],
      fileKey: "https://acleddata.com/data-export-tool/",
      fileName: "acled-east-africa-2020-2025.csv",
      fileSize: 8400000,
      fileType: "text/csv",
      format: "CSV",
      source: "ACLED (Armed Conflict Location & Event Data Project)",
      license: "CC BY-NC-SA 4.0",
      version: "2.5",
      coverage: "East Africa (Jan 2020 – Dec 2025)",
      keywords: ["acled", "protests", "demonstrations", "political-violence", "riots", "east-africa", "conflict"],
      methodology:
        "ACLED collects real-time data on political violence and protest from local, national, and international media sources, NGO reports, and research networks. All events are geolocated and assigned to standardized actor and event type taxonomies. Data is updated weekly.",
      isPublic: true,
    },
    {
      title: "Carnegie Global Protest Tracker — Sub-Saharan Africa 2017–2025",
      description:
        "Tracks significant anti-government protests in Sub-Saharan Africa since 2017, including trigger events, protest duration, government response, and outcomes. Compiled by the Carnegie Endowment for International Peace.",
      category: "Conflict",
      tags: ["protests", "anti-government", "sub-saharan-africa", "carnegie", "demonstrations"],
      fileKey: "https://carnegieendowment.org/features/global-protest-tracker",
      fileName: "carnegie-protest-tracker-africa-2017-2025.json",
      fileSize: 1200000,
      fileType: "application/json",
      format: "JSON",
      source: "Carnegie Endowment for International Peace",
      license: "Public Domain",
      version: "1.0",
      coverage: "Sub-Saharan Africa (2017–2025)",
      keywords: ["protests", "demonstrations", "anti-government", "carnegie", "africa", "civic-unrest"],
      methodology:
        "Carnegie researchers coded significant protests (1,000+ participants or notable outcomes) using news archives, academic sources, and NGO reports. Variables include trigger, peak size, government response, and whether demands were met.",
      isPublic: true,
    },
    {
      title: "APCOF Police Accountability Indicators — Africa 2018–2024",
      description:
        "Comparative dataset on police governance, civilian oversight mechanisms, and misconduct complaint rates across 15 African countries. Compiled by the African Policing Civilian Oversight Forum (APCOF), the continent's leading body on police accountability.",
      category: "Governance",
      tags: ["police", "accountability", "misconduct", "apcof", "oversight", "africa"],
      fileKey: "https://apcof.org/publications/",
      fileName: "apcof-police-accountability-africa-2018-2024.xlsx",
      fileSize: 3100000,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      format: "Excel",
      source: "African Policing Civilian Oversight Forum (APCOF)",
      license: "CC BY 4.0",
      version: "3.0",
      coverage: "15 African countries (2018–2024)",
      keywords: ["police", "misconduct", "oversight", "accountability", "excessive-force", "detention", "africa"],
      methodology:
        "Data collected through surveys of oversight institutions, review of official complaint registers, parliamentary reports, and field interviews with oversight body staff. Indicators standardized using APCOF's Police Oversight Assessment Framework.",
      isPublic: true,
    },
    {
      title: "Global Corruption Barometer Africa 2019 — Bribery & Corruption Experiences",
      description:
        "Transparency International's landmark survey of 47,000 people across 35 African countries on their direct experiences of bribery and perceptions of corruption. Includes data on which public institutions demand bribes most frequently, disaggregated by country and service type.",
      category: "Governance",
      tags: ["corruption", "bribery", "transparency-international", "survey", "africa", "gcb"],
      fileKey: "https://www.transparency.org/en/gcb/africa/africa-2019",
      fileName: "global-corruption-barometer-africa-2019.csv",
      fileSize: 5600000,
      fileType: "text/csv",
      format: "CSV",
      source: "Transparency International",
      license: "CC BY-ND 4.0",
      version: "1.0",
      coverage: "35 African countries (2019)",
      keywords: ["corruption", "bribery", "transparency", "public-services", "police", "courts", "gcb", "survey"],
      methodology:
        "Nationally representative face-to-face surveys conducted by local research partners using a standardized questionnaire. Sample weighted to reflect national demographics. Bribery rate = % who paid a bribe when accessing a specific public service in the past 12 months.",
      isPublic: true,
    },
    {
      title: "Afrobarometer Governance & Corruption Survey Data — Rounds 7–9 (2018–2023)",
      description:
        "Public opinion survey data on governance quality, corruption perceptions, and institutional trust across 39 African countries. Includes 20+ years of trend data on questions about elected officials, public service delivery, and anti-corruption enforcement.",
      category: "Governance",
      tags: ["afrobarometer", "governance", "corruption", "public-opinion", "africa", "survey"],
      fileKey: "https://www.afrobarometer.org/online-data-analysis",
      fileName: "afrobarometer-governance-rounds7-9-merged.csv",
      fileSize: 12800000,
      fileType: "text/csv",
      format: "CSV",
      source: "Afrobarometer",
      license: "CC BY 4.0",
      version: "9.0",
      coverage: "39 African countries (2018–2023)",
      keywords: ["afrobarometer", "governance", "corruption", "elections", "public-opinion", "trust", "institutions"],
      methodology:
        "Stratified probability sampling of 1,200–2,400 adults per country. Standardized questionnaire translated into local languages. Data weighted by population size. Publicly accessible via the Afrobarometer Online Data Analysis tool.",
      isPublic: true,
    },
    {
      title: "Kenya Auditor General Reports — National & County Government 2019–2024",
      description:
        "Structured dataset extracted from the Office of the Auditor General Kenya's annual audit reports covering national ministries and all 47 county governments. Includes audit opinions, flagged irregularities, amounts queried, and department-level findings on public fund management.",
      category: "Governance",
      tags: ["audit", "public-funds", "kenya", "accountability", "county-government", "oag"],
      fileKey: "https://www.oagkenya.go.ke/reports/",
      fileName: "kenya-oag-audit-reports-structured-2019-2024.json",
      fileSize: 7200000,
      fileType: "application/json",
      format: "JSON",
      source: "Office of the Auditor General — Kenya (OAG Kenya)",
      license: "Public Domain",
      version: "1.4",
      coverage: "Kenya — National & 47 County Governments (2019–2024)",
      keywords: ["audit", "public-funds", "embezzlement", "ghost-workers", "procurement", "kenya", "accountability"],
      methodology:
        "Audit reports downloaded from the OAG Kenya portal and machine-processed to extract structured data on audit opinions, queried amounts, and finding categories. Manual review conducted to validate extraction accuracy.",
      isPublic: true,
    },
    {
      title: "World Bank BOOST — East Africa Public Expenditure Microdata",
      description:
        "Highly disaggregated government spending data for Kenya, Uganda, Tanzania, and Rwanda from the World Bank BOOST Open Budgets Portal. Covers budget allocations vs. actual expenditures by ministry, program, and economic classification.",
      category: "Governance",
      tags: ["public-spending", "budget", "world-bank", "east-africa", "boost", "transparency"],
      fileKey: "https://www.worldbank.org/en/programs/boost-portal",
      fileName: "worldbank-boost-east-africa-public-expenditure.xlsx",
      fileSize: 9800000,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      format: "Excel",
      source: "World Bank BOOST Open Budgets Portal",
      license: "CC BY 4.0",
      version: "2.2",
      coverage: "Kenya, Uganda, Tanzania, Rwanda (2015–2024)",
      keywords: ["budget", "expenditure", "public-funds", "world-bank", "boost", "fiscal", "transparency"],
      methodology:
        "Budget and expenditure data sourced directly from national treasury systems through World Bank country partnerships. Data standardized across countries using BOOST methodology and classifications aligned with IMF GFS standards.",
      isPublic: true,
    },
    {
      title: "Open Budget Survey — East Africa Transparency Index 2012–2023",
      description:
        "The International Budget Partnership's Open Budget Survey scores for East African countries across three dimensions: budget transparency, public participation, and oversight capacity. The only independent comparative measure of central government budget openness.",
      category: "Governance",
      tags: ["budget", "transparency", "ibp", "open-budget", "east-africa", "oversight"],
      fileKey: "https://internationalbudget.org/open-budget-survey/",
      fileName: "open-budget-survey-east-africa-2012-2023.csv",
      fileSize: 420000,
      fileType: "text/csv",
      format: "CSV",
      source: "International Budget Partnership (IBP)",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "East Africa (2012–2023, biennial)",
      keywords: ["budget", "transparency", "oversight", "ibp", "open-budget", "accountability", "parliament"],
      methodology:
        "Questionnaire-based assessment completed by independent in-country researchers and reviewed by government and civil society peers. Scores range 0–100 across 109 indicators grouped into three pillars.",
      isPublic: true,
    },
    {
      title: "NELDA Election Quality Dataset — East Africa & Horn 1945–2024",
      description:
        "The National Elections Across Democracy and Autocracy (NELDA) dataset coding 58 variables for every national election in East Africa and the Horn since 1945. Variables identify ballot stuffing, voter intimidation, opposition harassment, media restrictions, and post-election violence.",
      category: "Elections",
      tags: ["elections", "nelda", "irregularities", "fraud", "east-africa", "democracy"],
      fileKey: "https://nelda.co/",
      fileName: "nelda-east-africa-horn-elections-1945-2024.csv",
      fileSize: 980000,
      fileType: "text/csv",
      format: "CSV",
      source: "NELDA (National Elections Across Democracy and Autocracy)",
      license: "CC BY 4.0",
      version: "6.0",
      coverage: "East Africa & Horn of Africa (1945–2024)",
      keywords: ["elections", "fraud", "manipulation", "voter-intimidation", "ballot-stuffing", "nelda", "democracy"],
      methodology:
        "Expert coding of election conditions based on systematic review of election observer reports, journalistic accounts, and academic analyses. Binary and ordinal variables for each election round. Inter-coder reliability tested across all rounds.",
      isPublic: true,
    },
    {
      title: "EISA Election Observation Mission Reports — East & Southern Africa 2000–2024",
      description:
        "Structured summary dataset extracted from the Electoral Institute for Sustainable Democracy in Africa (EISA) election observation mission final reports for East and Southern Africa. Includes pre-election environment scores, voting-day assessment, and tabulation integrity ratings.",
      category: "Elections",
      tags: ["elections", "eisa", "observation", "africa", "irregularities", "oversight"],
      fileKey: "https://www.eisa.org/publications/eor/",
      fileName: "eisa-election-observation-reports-2000-2024.json",
      fileSize: 2300000,
      fileType: "application/json",
      format: "JSON",
      source: "Electoral Institute for Sustainable Democracy in Africa (EISA)",
      license: "CC BY-NC 4.0",
      version: "1.3",
      coverage: "East & Southern Africa (2000–2024)",
      keywords: ["elections", "observation", "eisa", "fraud", "voter-suppression", "tabulation", "integrity"],
      methodology:
        "EISA long-term and short-term observers deployed across sampled polling stations. Reports follow a standardized assessment framework covering legal environment, campaign freedoms, voting day operations, and results management.",
      isPublic: true,
    },
    {
      title: "Ibrahim Index of African Governance (IIAG) — Full Dataset 2013–2023",
      description:
        "The Mo Ibrahim Foundation's comprehensive biennial governance index for all 54 African countries, covering 96 indicators grouped into Security & Rule of Law, Participation & Human Rights, Sustainable Economic Opportunity, and Human Development.",
      category: "Governance",
      tags: ["governance", "iiag", "mo-ibrahim", "rule-of-law", "africa", "index"],
      fileKey: "https://iiag.online/data.html",
      fileName: "ibrahim-index-african-governance-2013-2023.xlsx",
      fileSize: 4700000,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      format: "Excel",
      source: "Mo Ibrahim Foundation — Ibrahim Index of African Governance (IIAG)",
      license: "CC BY 4.0",
      version: "2023",
      coverage: "54 African countries (2013–2023)",
      keywords: ["governance", "rule-of-law", "human-rights", "democracy", "iiag", "africa", "index", "accountability"],
      methodology:
        "Composite index built from 96 indicators sourced from 35+ independent data providers including UN agencies, World Bank, Freedom House, and Transparency International. Annual scores computed using statistical aggregation and normalisation.",
      isPublic: true,
    },
    {
      title: "Kenya Commission on Administrative Justice — Complaints Register 2015–2024",
      description:
        "Aggregated complaint data from Kenya's Constitutional Ombudsman (Commission on Administrative Justice) covering maladministration, abuse of power, and unreasonable delays in public service delivery. Disaggregated by institution, county, and complaint category.",
      category: "Governance",
      tags: ["ombudsman", "complaints", "kenya", "maladministration", "abuse-of-office", "caj"],
      fileKey: "https://www.ombudsman.go.ke/reports/",
      fileName: "kenya-ombudsman-complaints-register-2015-2024.csv",
      fileSize: 3400000,
      fileType: "text/csv",
      format: "CSV",
      source: "Commission on Administrative Justice (Ombudsman) — Kenya",
      license: "Public Domain",
      version: "1.1",
      coverage: "Kenya — 47 Counties (2015–2024)",
      keywords: ["ombudsman", "complaints", "maladministration", "abuse-of-office", "public-service", "kenya", "accountability"],
      methodology:
        "Data extracted from CAJ annual reports and complaint databases. Includes complaint intake, investigation status, and resolution outcomes. Personal identifiers removed to protect complainant confidentiality.",
      isPublic: true,
    },
    {
      title: "Kikasha E-Petitions Platform — Kenya Civic Petitions 2021–2025",
      description:
        "Dataset of civic petitions submitted through the Kikasha digital petitions platform in Kenya. Includes petition subject, petitioned institution, signature count, geographic origin, and government response status. Represents a cross-section of community-level governance grievances.",
      category: "Civic Participation",
      tags: ["petitions", "kenya", "civic", "kikasha", "community", "governance"],
      fileKey: "https://kikasha.com/petitions",
      fileName: "kikasha-civic-petitions-kenya-2021-2025.json",
      fileSize: 870000,
      fileType: "application/json",
      format: "JSON",
      source: "Kikasha E-Petitions Platform",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya (2021–2025)",
      keywords: ["petitions", "civic", "community", "kenya", "e-petitions", "participation", "kikasha"],
      methodology:
        "Petition metadata exported from the Kikasha platform API. Includes petitions that reached the signature threshold for official submission to government. Personal signer data removed; only aggregate counts and geography retained.",
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

seedDatasets()
  .then(() => {
    console.log("✨ Datasets seeding process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
