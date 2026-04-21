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

// Description templates grounded in incident patterns from ACLED, APCOF, NELDA, EISA,
// GCB Africa, Afrobarometer, OAG Kenya, World Bank BOOST, Kikasha, and IIAG.
const descriptionTemplates = {
  "Public demonstrations": [
    "Opposition supporters staged a street protest following disputed local government results, blocking a main arterial road for several hours. Security forces arrived and fired teargas to disperse the crowd, injuring at least four demonstrators. ACLED-coded as a 'protest with violence' event.",
    "University students marched on parliament demanding reversal of tuition fee increases and transparency in the disbursement of government bursaries. Riot police formed a cordon; no arrests reported. The march was organized through social media within 48 hours of the policy announcement.",
    "Health workers held a work stoppage outside the district hospital demanding unpaid salary arrears exceeding six months. Placards cited the county government's failure to remit payroll deductions. A parallel petition with over 800 signatures was submitted to the county assembly.",
    "Bodaboda (motorcycle taxi) operators blocked a major junction to protest against police extortion at checkpoints. Demonstrators reported that officers routinely demand informal payments between 100 and 500 shillings per pass, amounting to a significant daily levy. The protest dispersed without incident after a ward administrator addressed the crowd.",
    "Civil society groups organized a sit-in outside the county offices to demand public disclosure of the supplementary budget following the Auditor General's adverse opinion on the previous year's accounts. Participants cited specific paragraphs from the audit report listing unaccounted expenditures.",
    "Hundreds of residents marched to the sub-county offices after the government demolished homes in an informal settlement without prior notice or resettlement support. A Carnegie Protest Tracker-style trigger was identified: forced evictions without adequate warning or compensation.",
    "Traders demonstrated at the local government offices against the installation of electronic revenue collection terminals, alleging the new system bypasses proper procurement and that associated fees are not remitted to the county treasury.",
    "Former employees of a state enterprise blocked the facility entrance demanding retrenchment benefits outstanding for over two years. They presented a notarized petition and copies of signed termination agreements that the employer had failed to honour.",
    "Residents held a memorial march on the anniversary of a police shooting that killed two unarmed young men at a night market. The event coincided with a human rights organization releasing a report documenting the incident as an extrajudicial killing, citing witness affidavits.",
    "A women's rights coalition staged a protest outside the magistrate's court during proceedings of a domestic violence case, alleging police had repeatedly failed to enforce a protection order against the accused.",
  ],
  "Election Irregularities": [
    "Accredited party agents at a tallying centre reported that results from three polling stations arrived with altered Form 34A tallies — official polling station result declarations showing handwritten corrections that were not countersigned by presiding officers as required by electoral law. EISA observers on site noted the discrepancies in their field reports.",
    "Voter roll printed for a ward showed 340 names registered at a single residential address, consistent with the type of registration inflation pattern coded by NELDA as 'voter list manipulation'. Verified residents at the address confirmed most listed persons are unknown to them.",
    "Multiple reports of voters being offered KES 500 and a bag of maize flour by agents in party campaign colours near a polling station. Vote buying is one of the 58 NELDA variables coded as present for this election. Witnesses declined to report to police, citing fear of retaliation.",
    "Presiding officer at a rural polling station allegedly refused to accept votes from community members who hold national identity cards issued in another county, despite the electoral commission's own guidelines permitting voting at one's registered station regardless of ID issuance origin.",
    "Electoral materials — ballot papers, indelible ink, and result transmission kits — arrived at a polling station four hours after official opening time, effectively suppressing turnout in an opposition-leaning ward. EISA long-term observers documented similar patterns of late material distribution in at least seven stations in the region.",
    "An opposition candidate's election agent was forcibly removed from the tallying centre by plainclothes individuals without identification, in violation of electoral regulations requiring party representation during counting. Police at the scene refused to intervene.",
    "Statistical analysis of results from a sub-county revealed an implausible turnout pattern: seven consecutive polling stations reported exactly 100% voter turnout — a result inconsistent with normal distributions and flagged by parallel vote tabulation analysts as indicative of result fabrication.",
    "Community members reported witnessing the transportation of pre-filled ballot papers in an unmarked vehicle near a polling station warehouse the night before election day. Photographs taken by a local journalist were later referenced in an AU Election Observation Mission preliminary statement.",
    "An incumbent official's supporters were documented using government-branded vehicles and materials in active campaign activities on election day, violating the electoral period restrictions on use of state resources. The electoral commission received a formal complaint but issued no public response.",
    "Voters in a border constituency reported that armed herders — not registered in this ward — were transported to polling stations and permitted to vote after brief discussions with local security personnel. ACLED codes analogous events as 'electoral violence with state involvement'.",
  ],
  "Abuse of office": [
    "A county department head allegedly awarded a construction contract valued at KES 45 million to a company in which his wife holds a directorship. The connection was identified by a local civil society organization cross-referencing company registry records with procurement notices. A formal complaint has been lodged with the Ethics and Anti-Corruption Commission.",
    "A ward administrator reportedly demanded a facilitation fee to process a permit application that should be issued free of charge under the Business Licensing Act. The applicant recorded the conversation on a mobile phone. The recording was submitted to the Commission on Administrative Justice as evidence of maladministration.",
    "The sub-county education officer is accused of reassigning teachers from underperforming rural schools to urban schools in exchange for personal payments. Parents at three affected schools submitted a joint petition documenting six unexplained teacher transfers in eight months.",
    "A senior police officer allegedly intervened to have charges against his relative dropped after the relative was arrested for assault. The officer is accused of telephoning the station commander and directing the OCS to release the suspect without charge. The victim filed a complaint with IPOA.",
    "A government hospital administrator is accused of diverting pharmaceutical supplies meant for the public facility to a private clinic he co-owns. A nurse who reported the practice to the Ministry of Health was subsequently threatened with disciplinary action.",
    "Land officials are accused of issuing title deeds for a gazetted public forest to private individuals with political connections, in contravention of environmental protection regulations. An ombudsman complaint was filed citing the CAJ Act provisions on abuse of discretionary authority.",
    "A procurement officer in the water utility is alleged to have disqualified the lowest-cost compliant bidder from a pipeline tender, re-scoring the technical evaluation to favour a higher-cost vendor with ties to the officer's family. The losing bidder filed a formal challenge with the Public Procurement Regulatory Authority.",
    "Municipal council officers allegedly demolished a legally compliant small business stall after the owner refused to pay an unofficial protection fee. Witnesses and a local councillor confirmed that other stallholders make regular payments to avoid similar action.",
    "A senior civil servant is accused of using official government vehicles, fuel cards, and support staff for personal errands and the running of a private events business during working hours. The complaint was filed with the Public Service Commission citing breach of conduct rules.",
    "Immigration officers at a border post are accused of facilitating undocumented crossings in exchange for payment, undermining border security protocols. Multiple eyewitness accounts describe a predictable fee structure known to cross-border traders.",
  ],
  "Community petitions": [
    "Residents of an informal settlement submitted a 1,200-signature petition to the county assembly's public petitions committee demanding the county cease demolitions until a formal resettlement and compensation framework is gazetted, citing a right to housing under Article 43 of the Constitution.",
    "A parents and teachers association filed a petition to the county education board documenting that the ward's primary school has operated without a functioning toilet block for three years despite a budgeted allocation appearing in the county's development plan for each of those years.",
    "Over 700 boda boda operators submitted a petition to the sub-county commissioner and the local police commander demanding the end of informal checkpoint payments and requesting that a transparent, official levy schedule be published and enforced.",
    "Fisherfolk from a lakeshore community submitted a petition to the fisheries authority reporting that a private company's discharge has contaminated their primary fishing grounds and caused a sharp decline in catch. The petition requests an independent environmental audit and immediate cessation of discharge pending results.",
    "A disability rights coalition submitted a petition to the county hospital's board citing systematic failure to provide sign language interpretation during consultations, violating the persons with disability rights framework and denying deaf patients informed consent.",
    "Market traders petitioned the municipal authority after a fire destroyed market stalls, arguing that the government's failure to maintain fire extinguisher equipment and enforce building code compliance contributed directly to the losses, and requesting compensation and accountability.",
    "Residents adjacent to a proposed quarry submitted a petition demanding an environmental and social impact assessment be completed and publicly shared before any extraction licence is issued, citing erosion of a community water catchment as the key risk.",
    "Youth leaders from a peri-urban ward submitted a petition to the Member of Parliament documenting the non-delivery of a constituency development fund bursary cycle, naming 312 students whose applications were approved but whose payments have not materialized.",
    "A coalition of community health workers submitted a petition to the county health department citing non-payment of their monthly stipends for five consecutive months and requesting a written commitment from the county executive on a payment schedule.",
    "Women's groups from three villages submitted a joint petition to the chief's office and the children's department requesting urgent intervention after a pattern of early marriage and school dropout was linked to a local council elder's facilitation of underage bride price negotiations.",
  ],
  "Police misconduct": [
    "A 34-year-old man died in police custody 18 hours after his arrest on allegations of robbery with violence. Family members who visited the holding cell report he appeared in good health at the time of arrest. The death was reported to IPOA in Kenya as a mandated custodial death notification. The autopsy report has not been shared with the family.",
    "Officers from the anti-narcotics unit raided a residential home without presenting a search warrant. Occupants report that approximately KES 80,000 in household savings and mobile phones were taken by officers and not receipted. A formal complaint has been filed with the police station and simultaneously with the Independent Policing Oversight Authority.",
    "Multiple matatu drivers report that officers at a weighbridge checkpoint routinely demand between KES 200–500 per vehicle to avoid roadworthiness inspection, regardless of vehicle condition. The APCOF assessment typology classifies this as 'systematic extortion at fixed enforcement points' — one of the most commonly reported forms of police corruption in East Africa.",
    "A journalist was arrested while filming a public demonstration and held for 28 hours without being charged or brought before a court, exceeding the constitutional 24-hour limit. The journalist's camera equipment was confiscated and has not been returned. The Media Council filed a complaint with the Inspector General.",
    "Four men were arrested at a night spot and transported to a police post, where they allege officers beat them with rubber batons and demanded KES 10,000 each to secure their release before any charges were recorded. They were released without charge the following morning after payment.",
    "A woman who reported a domestic assault to the police station alleges that the OCS told her the matter was a 'family dispute' and declined to open an OB entry or record a statement. She subsequently learned from a neighbour that the accused has a drinking relationship with officers at the station.",
    "Police fired live ammunition into a crowd of demonstrators protesting a local government demolition order, wounding three people. The incident has been coded as a 'protest with fatalities/injuries from security forces' in ACLED's real-time dataset. The regional police commander stated the officers acted in self-defence; no officer has been placed on administrative action.",
    "Officers conducting a late-night patrol allegedly entered a home without cause, struck the male occupant in front of his children, and left without providing a reason or identifying themselves. No OB number was issued. The family was unable to report the incident at the station after being told by the duty officer to 'come back in the morning'.",
    "A vendor at a market was arrested after allegedly refusing to pay the daily informal fee collected by two officers assigned to the area. Witnesses state the vendor had previously complained to the market manager about the practice. The vendor was held overnight and released after paying an unofficial fine.",
    "Former detainees from a police holding cell in a densely populated urban area described systematic practices of overcrowding, denial of water for up to 12 hours, and forced stress positions during interrogation. The accounts corroborate APCOF's published findings on detention conditions in urban police facilities across East Africa.",
  ],
  "Misuse of public funds": [
    "A community health centre that received a full disbursement from the county health budget for medical equipment — confirmed by the county's own procurement records — has no functioning equipment on site two years later. Staff state the equipment was delivered to and signed for at the facility, but was relocated within days and its current location is unknown.",
    "The county Auditor General's report for FY2022/23 identified 47 employees on the payroll of a subcounty office who could not be traced to any functional role or physical location. The combined annual salary for these ghost workers exceeds KES 12 million. No disciplinary action has been announced.",
    "A contractor paid 80% of the project cost for a rural road construction project — equivalent to KES 24 million from a CDF allocation — completed less than 30% of the specified work before abandoning the site. The procurement officer who approved the staged payments is a relative of the contractor's company director.",
    "Community members in a low-income settlement report they have never received the social protection cash transfer to which they are enrolled according to a government list shown to them by a local official. Afrobarometer survey data from this county indicates one of the highest rates of reported bribery for accessing social services in the region.",
    "A ward development committee member alleges that invoices submitted for a public toilet construction project were inflated by approximately 340%. A local quantity surveyor provided a written assessment confirming the cost variance. The documentation was submitted to the county assembly public accounts committee.",
    "Three schools in the same sub-county constituency received no capitation grant disbursement in the third and fourth terms of the school year, despite the Ministry of Education's records showing full disbursement to the school accounts. Bank statements provided by one headteacher show the funds were transferred in and withdrawn the same day by a third party with no school authorization.",
    "A community group accessed procurement documents through a freedom of information request and found that a water pipeline project awarded to a single-director company was procured through direct procurement without the mandatory justification report, and at a unit cost 60% above the industry benchmark for equivalent projects.",
    "Workers on a government-funded road project report they have not been paid for four weeks of completed work. The main contractor produced documentation showing that the subcounty engineer's office had approved payment claims. Workers believe the approved payments were collected by the contractor and not passed on, a pattern the World Bank BOOST analysis describes as 'last-mile disbursement leakage'.",
    "A National Hospital Insurance Fund satellite office allegedly processed reimbursement claims for services that the corresponding health facility has no capacity to provide — including specialist procedures requiring equipment not present at the facility. Tip-off submitted by a healthcare worker who reviewed the reimbursement records.",
    "An emergency drought relief consignment of 200 bags of maize and 100 cartons of cooking oil — documented on county relief distribution records — was reported by community distribution monitors as never arriving at the designated village. Beneficiary household verification sheets were signed by a local official but residents deny having received anything.",
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

// Seed incidents for March 16–31, 2026
const SEED_START_DATE = new Date("2026-03-16T00:00:00.000Z");
const SEED_END_DATE = new Date("2026-03-31T23:59:59.999Z");

// Helper function to get random date within seed range
function randomDate(): Date {
  const timestamp =
    SEED_START_DATE.getTime() +
    Math.random() * (SEED_END_DATE.getTime() - SEED_START_DATE.getTime());
  return new Date(timestamp);
}

// Helper function to add random variation to coordinates
function addVariation(coord: number, range: number = 0.05): number {
  return coord + (Math.random() - 0.5) * range;
}

// Number of incidents per incident type for this short window (~5–8 each)
const INCIDENTS_PER_TYPE = 7;

async function seedIncidentReportsMarch2026() {
  try {
    console.log(
      "🌱 Seeding incident reports for March 16–31, 2026...",
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

    for (const incidentType of types) {
      console.log(
        `\n📝 Generating ${INCIDENTS_PER_TYPE} incidents for: ${incidentType.name}`,
      );

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

      for (let i = 0; i < INCIDENTS_PER_TYPE; i++) {
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

        // Random casualties (weighted towards lower numbers)
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

        const createdAt = randomDate();

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

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < reportsToInsert.length; i += batchSize) {
      const batch = reportsToInsert.slice(i, i + batchSize);
      await db.insert(anonymousIncidentReports).values(batch);
      console.log(
        `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(reportsToInsert.length / batchSize)}`,
      );
    }

    console.log("\n🎉 Successfully seeded March 2026 incident reports!");
    console.log(`📊 Total reports created: ${reportsToInsert.length}`);

    console.log("\n📈 Summary by incident type:");
    for (const incidentType of types) {
      const count = reportsToInsert.filter(
        (r) => r.incidentTypeId === incidentType.id,
      ).length;
      if (count > 0) console.log(`   ${incidentType.name}: ${count} reports`);
    }
  } catch (error) {
    console.error("❌ Error seeding incident reports:", error);
    process.exit(1);
  }
}

seedIncidentReportsMarch2026();
