import "dotenv/config";
import { db } from "@/db";
import { anonymousIncidentReports } from "@/db/schemas/anonymous-incident-reports";
import { incidentTypes } from "@/db/schemas/incident-types";
import { eq } from "drizzle-orm";

// Selected countries with expanded regions and coordinates
const countries = [
  {
    name: "Kenya",
    regions: [
      { name: "Nairobi", lat: -1.286389, lon: 36.817223 },
      { name: "Mombasa", lat: -4.043477, lon: 39.668206 },
      { name: "Kisumu", lat: -0.091702, lon: 34.767956 },
      { name: "Nakuru", lat: -0.303099, lon: 36.080026 },
      { name: "Eldoret", lat: 0.514277, lon: 35.269779 },
      { name: "Thika", lat: -1.033333, lon: 37.083332 },
      { name: "Malindi", lat: -3.219577, lon: 40.116875 },
      { name: "Garissa", lat: -0.453056, lon: 39.658333 },
      { name: "Kitale", lat: 1.015778, lon: 35.006111 },
      { name: "Machakos", lat: -1.516667, lon: 37.266667 },
      { name: "Nyeri", lat: -0.426944, lon: 36.947778 },
      { name: "Kakamega", lat: 0.283333, lon: 34.75 },
      { name: "Naivasha", lat: -0.716667, lon: 36.433333 },
      { name: "Kericho", lat: -0.368056, lon: 35.285278 },
      { name: "Embu", lat: -0.533333, lon: 37.45 },
      { name: "Lamu", lat: -2.271667, lon: 40.9 },
    ],
  },
  {
    name: "Uganda",
    regions: [
      { name: "Kampala", lat: 0.347596, lon: 32.58252 },
      { name: "Entebbe", lat: 0.056693, lon: 32.463364 },
      { name: "Gulu", lat: 2.774774, lon: 32.299881 },
      { name: "Mbarara", lat: -0.606588, lon: 30.65737 },
      { name: "Jinja", lat: 0.43194, lon: 33.204163 },
      { name: "Lira", lat: 2.249906, lon: 32.898758 },
      { name: "Mbale", lat: 1.08222, lon: 34.175224 },
      { name: "Kasese", lat: 0.183333, lon: 30.083333 },
      { name: "Masaka", lat: -0.333333, lon: 31.733333 },
      { name: "Arua", lat: 3.019722, lon: 30.910556 },
      { name: "Hoima", lat: 1.433333, lon: 31.35 },
      { name: "Soroti", lat: 1.714722, lon: 33.611111 },
      { name: "Kabale", lat: -1.248611, lon: 29.989444 },
      { name: "Fort Portal", lat: 0.671111, lon: 30.275 },
      { name: "Tororo", lat: 0.693056, lon: 34.180556 },
      { name: "Mukono", lat: 0.353333, lon: 32.755556 },
    ],
  },
  {
    name: "Tanzania",
    regions: [
      { name: "Dar es Salaam", lat: -6.792354, lon: 39.208328 },
      { name: "Arusha", lat: -3.386925, lon: 36.682995 },
      { name: "Mwanza", lat: -2.516667, lon: 32.900002 },
      { name: "Dodoma", lat: -6.162959, lon: 35.751607 },
      { name: "Moshi", lat: -3.35022, lon: 37.337891 },
      { name: "Zanzibar", lat: -6.165918, lon: 39.202641 },
      { name: "Tanga", lat: -5.068912, lon: 39.098686 },
      { name: "Morogoro", lat: -6.821005, lon: 37.663214 },
      { name: "Mbeya", lat: -8.9, lon: 33.45 },
      { name: "Iringa", lat: -7.77, lon: 35.69 },
      { name: "Kigoma", lat: -4.877222, lon: 29.626944 },
      { name: "Tabora", lat: -5.016667, lon: 32.8 },
      { name: "Songea", lat: -10.683333, lon: 35.65 },
      { name: "Shinyanga", lat: -3.663889, lon: 33.421111 },
      { name: "Singida", lat: -4.816667, lon: 34.75 },
      { name: "Bukoba", lat: -1.333333, lon: 31.816667 },
    ],
  },
  {
    name: "Ethiopia",
    regions: [
      { name: "Addis Ababa", lat: 9.024325, lon: 38.746826 },
      { name: "Dire Dawa", lat: 9.593028, lon: 41.866715 },
      { name: "Mekelle", lat: 13.496667, lon: 39.475278 },
      { name: "Gondar", lat: 12.6, lon: 37.466667 },
      { name: "Hawassa", lat: 7.062122, lon: 38.476609 },
      { name: "Bahir Dar", lat: 11.593611, lon: 37.390556 },
      { name: "Jimma", lat: 7.67722, lon: 36.834717 },
      { name: "Adama", lat: 8.54, lon: 39.268333 },
      { name: "Dessie", lat: 11.13, lon: 39.633333 },
      { name: "Harar", lat: 9.313889, lon: 42.117778 },
      { name: "Jijiga", lat: 9.35, lon: 42.8 },
      { name: "Debre Markos", lat: 10.35, lon: 37.716667 },
      { name: "Axum", lat: 14.133333, lon: 38.716667 },
      { name: "Nekemte", lat: 9.083333, lon: 36.533333 },
      { name: "Asella", lat: 7.95, lon: 39.133333 },
      { name: "Sodo", lat: 6.916667, lon: 37.75 },
    ],
  },
  {
    name: "Rwanda",
    regions: [
      { name: "Kigali", lat: -1.970579, lon: 30.104429 },
      { name: "Butare", lat: -2.596667, lon: 29.739444 },
      { name: "Gisenyi", lat: -1.677813, lon: 29.256138 },
      { name: "Ruhengeri", lat: -1.5, lon: 29.633333 },
      { name: "Gitarama", lat: -2.074167, lon: 29.7575 },
      { name: "Byumba", lat: -1.576389, lon: 30.067222 },
      { name: "Cyangugu", lat: -2.484444, lon: 28.906944 },
      { name: "Kibungo", lat: -2.159722, lon: 30.544167 },
      { name: "Kibuye", lat: -2.06, lon: 29.346667 },
      { name: "Rwamagana", lat: -1.948611, lon: 30.434722 },
      { name: "Nyanza", lat: -2.351667, lon: 29.749167 },
      { name: "Muhanga", lat: -2.083333, lon: 29.75 },
      { name: "Rubavu", lat: -1.683333, lon: 29.266667 },
      { name: "Musanze", lat: -1.5, lon: 29.633333 },
      { name: "Huye", lat: -2.6, lon: 29.741667 },
      { name: "Kayonza", lat: -1.884722, lon: 30.616667 },
    ],
  },
  {
    name: "Pakistan",
    regions: [
      { name: "Karachi", lat: 24.8607, lon: 67.0011 },
      { name: "Lahore", lat: 31.5497, lon: 74.3436 },
      { name: "Islamabad", lat: 33.6844, lon: 73.0479 },
      { name: "Rawalpindi", lat: 33.5651, lon: 73.0169 },
      { name: "Faisalabad", lat: 31.4181, lon: 73.0776 },
      { name: "Multan", lat: 30.1575, lon: 71.5249 },
      { name: "Peshawar", lat: 34.0151, lon: 71.5249 },
      { name: "Quetta", lat: 30.1798, lon: 66.975 },
      { name: "Sialkot", lat: 32.4945, lon: 74.5361 },
      { name: "Gujranwala", lat: 32.1617, lon: 74.1883 },
      { name: "Bahawalpur", lat: 29.3956, lon: 71.6722 },
      { name: "Sargodha", lat: 32.0836, lon: 72.6711 },
      { name: "Hyderabad", lat: 25.3792, lon: 68.3683 },
      { name: "Sukkur", lat: 27.7059, lon: 68.8574 },
      { name: "Larkana", lat: 27.56, lon: 68.214 },
      { name: "Sheikhupura", lat: 31.7161, lon: 73.985 },
    ],
  },
];

// Entity options
const entityOptions = [
  "law-enforcement",
  "security-forces",
  "judicial-system",
  "government-officials",
  "victims-witnesses",
  "journalists-media",
  "activists-protestors",
  "human-rights-organizations",
  "csos",
  "united-nations",
  "regional-bodies",
  "foreign-governments",
  "international-ngos",
  "private-security-firms",
  "private-sector-corporations",
  "legal-professionals",
  "perpetrators",
];

// Description templates for each incident type
const descriptionTemplates = {
  "Public demonstrations": [
    "Large peaceful demonstration organized by civil society groups demanding accountability from government officials. Participants carried banners and chanted slogans calling for transparency in governance.",
    "Student-led protest march through the city center advocating for improved public services. Police presence was minimal and the event concluded peacefully.",
    "Workers union organized a sit-in demonstration outside government offices demanding better working conditions and fair wages for public sector employees.",
    "Civic activists staged a peaceful demonstration calling for electoral reforms and transparent voting processes. Several speakers addressed the crowd about democratic rights.",
    "Community members gathered in public square to protest against proposed policy changes that would affect local livelihoods. The demonstration remained orderly throughout.",
    "Youth groups organized a march advocating for climate action and environmental protection. Participants highlighted concerns about local environmental degradation.",
    "Citizens held a candlelight vigil in memory of victims of past injustices while calling for accountability and reform of security institutions.",
    "Religious leaders led a peaceful prayer demonstration calling for unity and reconciliation among different community groups.",
  ],
  "Election Irregularities": [
    "Multiple voters reported being turned away from polling stations despite having valid registration documents. Election observers documented systematic voter suppression attempts.",
    "Ballot boxes were discovered to contain pre-marked ballots at several polling stations. Independent monitors raised concerns about the integrity of the counting process.",
    "Credible reports indicate voter intimidation tactics were employed near polling areas. Several individuals reported threats against voting for opposition candidates.",
    "Discrepancies found between official vote tallies and independent observer counts at multiple polling centers. The margin of difference raised serious questions about accuracy.",
    "Evidence of vote buying scheme uncovered in several constituencies. Witnesses reported cash payments being offered in exchange for supporting specific candidates.",
    "Election materials arrived late to remote polling stations, disenfranchising voters. Some locations reported opening hours after official voting was supposed to begin.",
    "Documented cases of underage individuals being allowed to cast ballots. Election commission failed to verify age requirements at several polling places.",
    "Parallel tallying by civil society organizations revealed significant statistical anomalies in official results from multiple voting districts.",
  ],
  "Abuse of office": [
    "Government official allegedly diverted public funds intended for community development projects into personal accounts. Civil society groups filed complaints with anti-corruption authorities.",
    "Senior official accused of using state resources for private business ventures. Documents suggest systematic misuse of public property for personal gain.",
    "Reports indicate nepotism in hiring practices at government ministry. Qualified candidates overlooked in favor of relatives and political associates of senior officials.",
    "Public procurement process compromised by official favoring companies with personal connections. Tender documents reveal irregularities in contractor selection procedures.",
    "Authority figure allegedly demanded bribes from citizens seeking basic public services. Multiple complainants came forward describing similar experiences.",
    "Government employee accused of falsifying documents to benefit political allies. Investigation revealed pattern of document manipulation spanning several months.",
    "Official used position of power to obstruct justice in criminal proceedings involving associates. Legal professionals raised concerns about judicial independence.",
    "Evidence emerged of preferential treatment given to cronies in allocation of public housing. Deserving beneficiaries bypassed in favor of connected individuals.",
  ],
  "Community petitions": [
    "Local residents submitted formal petition to authorities demanding improved sanitation services. Over 500 signatures collected from affected community members.",
    "Citizens coalition filed petition requesting public inquiry into alleged environmental violations by industrial facility. Concerns raised about water contamination.",
    "Neighborhood groups petitioned municipality for better street lighting and increased security patrols. Residents cited recent safety incidents in their appeal.",
    "Farmers association presented petition to agricultural ministry seeking support programs and fair market access. Delegates outlined specific policy recommendations.",
    "Parents committee submitted petition demanding improvements to local school infrastructure. Document highlighted overcrowding and inadequate facilities.",
    "Small business owners collectively petitioned for review of burdensome licensing requirements. Petition argued regulations inhibit economic growth and employment.",
    "Healthcare advocates filed petition calling for expanded medical services in underserved areas. Health statistics included to support need for intervention.",
    "Transport workers submitted petition requesting safer working conditions and proper regulations. Multiple incidents of neglect cited in formal complaint.",
  ],
  "Police misconduct": [
    "Officers allegedly used excessive force during routine traffic stop. Victim sustained injuries requiring medical treatment. Human rights organizations called for investigation.",
    "Credible reports of arbitrary detention without formal charges. Detainees held beyond legal limits without access to legal counsel or family members.",
    "Community members accused police of demanding bribes at checkpoint. Multiple motorists described similar shakedown tactics by officers on duty.",
    "Evidence of brutality during arrest procedure captured on video footage. Victim suffered visible injuries while already in custody and complying with officers.",
    "Police raided premises without proper warrant or legal authorization. Occupants reported destruction of property and unauthorized searches by officers.",
    "Officers failed to respond to emergency calls from vulnerable community. Multiple documented instances of police refusing to investigate reported crimes.",
    "Allegations of custodial torture emerged from detention facility. Former detainees described systematic mistreatment by interrogating officers.",
    "Police discriminated against minorities during stop and search operations. Pattern of targeting specific groups documented by civil rights monitors.",
  ],
  "Misuse of public funds": [
    "Audit revealed significant discrepancies in government department spending. Millions unaccounted for with insufficient documentation for expenditures.",
    "Public funds allocated for infrastructure development found diverted elsewhere. Contracted projects remain incomplete despite full payment to contractors.",
    "Investigation uncovered inflated invoicing scheme in government procurement. Suppliers colluded with officials to overcharge for goods and services.",
    "Ghost workers discovered on public payroll receiving salaries. Fictitious employees created to siphon funds from government wage budget.",
    "Development assistance funds intended for poverty alleviation programs misappropriated. Beneficiaries never received promised aid despite disbursement records.",
    "Budget allocated for medical supplies found spent on non-essential items. Critical health facilities lacking necessary equipment despite adequate funding.",
    "Educational grants embezzled by administrators meant for student scholarships. Deserving students denied support while funds disappeared.",
    "Emergency relief funds stalled or diverted during humanitarian crisis. Communities in need failed to receive timely assistance despite available resources.",
  ],
};

// Helper function to get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to get random elements from array
function randomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to add random variation to coordinates
function addVariation(coord: number, range: number = 0.05): number {
  return coord + (Math.random() - 0.5) * range;
}

// Dynamic date window: past 1 year up to now, so the past 7 days are always covered
function getSeedDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function randomDate(start: Date, end: Date): Date {
  const timestamp =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp);
}

async function seedClean() {
  try {
    console.log("🧹 Clearing existing incident reports...");
    await db.delete(anonymousIncidentReports);
    console.log("✅ All incident reports deleted.");

    console.log("\n🌱 Starting fresh seed...");

    const { start: seedStart, end: seedEnd } = getSeedDateRange();
    console.log(
      `📅 Date range: ${seedStart.toISOString().slice(0, 10)} → ${seedEnd.toISOString().slice(0, 10)}`,
    );

    // Fetch all incident types
    const types = await db
      .select()
      .from(incidentTypes)
      .where(eq(incidentTypes.isActive, true));

    if (types.length === 0) {
      console.error(
        "❌ No incident types found. Please run seed-incident-types first.",
      );
      process.exit(1);
    }

    console.log(`📊 Found ${types.length} incident types`);

    const reportsToInsert: any[] = [];

    // Generate 400 incidents for each incident type
    for (const incidentType of types) {
      console.log(`\n📝 Generating 400 incidents for: ${incidentType.name}`);

      const templates =
        descriptionTemplates[
          incidentType.name as keyof typeof descriptionTemplates
        ];

      if (!templates) {
        console.warn(
          `⚠️  No templates found for ${incidentType.name}, skipping...`,
        );
        continue;
      }

      for (let i = 0; i < 400; i++) {
        const country = randomElement(countries);
        const region = randomElement(country.regions);

        const lat = addVariation(region.lat);
        const lon = addVariation(region.lon);

        const location = {
          place_id: `${Math.random().toString(36).substring(7)}`,
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
          osm_type: "node",
          osm_id: Math.floor(Math.random() * 1000000000).toString(),
          boundingbox: [
            (lat - 0.01).toString(),
            (lat + 0.01).toString(),
            (lon - 0.01).toString(),
            (lon + 0.01).toString(),
          ],
          lat: lat.toString(),
          lon: lon.toString(),
          display_name: `${region.name}, ${country.name}`,
          region: country.name === "Pakistan" ? "South Asia" : "Eastern Africa",
          country: country.name,
          admin1: region.name,
          class: "place",
          type: "city",
          importance: Math.random(),
        };

        const description = randomElement(templates);
        const entities = randomElements(entityOptions, 1, 4);

        const injuriesRand = Math.random();
        const injuries =
          injuriesRand < 0.5
            ? 0
            : injuriesRand < 0.75
              ? Math.floor(Math.random() * 3) + 1
              : Math.floor(Math.random() * 6) + 1;

        const fatalitiesRand = Math.random();
        const fatalities =
          fatalitiesRand < 0.7
            ? 0
            : fatalitiesRand < 0.9
              ? Math.floor(Math.random() * 2) + 1
              : Math.floor(Math.random() * 4) + 1;

        const createdAt = randomDate(seedStart, seedEnd);

        reportsToInsert.push({
          incidentTypeId: incidentType.id,
          location,
          description,
          entities,
          injuries,
          fatalities,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    console.log(
      `\n💾 Inserting ${reportsToInsert.length} incident reports into database...`,
    );

    // Insert in batches of 100 to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < reportsToInsert.length; i += batchSize) {
      const batch = reportsToInsert.slice(i, i + batchSize);
      await db.insert(anonymousIncidentReports).values(batch);
      console.log(
        `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(reportsToInsert.length / batchSize)}`,
      );
    }

    console.log("\n🎉 Successfully seeded all incident reports!");
    console.log(`📊 Total reports created: ${reportsToInsert.length}`);

    console.log("\n📈 Summary by incident type:");
    for (const incidentType of types) {
      const count = reportsToInsert.filter(
        (r) => r.incidentTypeId === incidentType.id,
      ).length;
      console.log(`   ${incidentType.name}: ${count} reports`);
    }
  } catch (error) {
    console.error("❌ Error during seed-clean:", error);
    process.exit(1);
  }
}

seedClean();
