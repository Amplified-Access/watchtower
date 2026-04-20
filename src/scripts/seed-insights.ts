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
import { inArray } from "drizzle-orm";

async function seedInsights() {
  console.log("🌱 Seeding insights data...");

  try {
    console.log("Upserting insight tags...");
    const tagsData = [
      { title: "Police Accountability", slug: "police-accountability" },
      { title: "Election Integrity", slug: "election-integrity" },
      { title: "Anti-Corruption", slug: "anti-corruption" },
      { title: "Public Finance", slug: "public-finance" },
      { title: "Civic Participation", slug: "civic-participation" },
      { title: "Human Rights", slug: "human-rights" },
      { title: "Governance", slug: "governance" },
      { title: "Research", slug: "research" },
      { title: "East Africa", slug: "east-africa" },
      { title: "Data & Evidence", slug: "data-evidence" },
    ];

    await db.insert(insightTags).values(tagsData).onConflictDoNothing();

    const slugs = tagsData.map((t) => t.slug);
    const createdTags = await db
      .select()
      .from(insightTags)
      .where(inArray(insightTags.slug, slugs));
    console.log(`✅ Tags ready: ${createdTags.length}`);

    const [firstUser] = await db.select().from(user).limit(1);

    if (!firstUser) {
      console.log("⚠️ No users found. Please create at least one user first.");
      return;
    }

    const insightsData = [
      {
        title: "The State of Police Accountability in East Africa: Evidence from APCOF's 2024 Assessment",
        slug: "police-accountability-east-africa-apcof-2024",
        description:
          "Drawing on the African Policing Civilian Oversight Forum's latest assessment, this analysis examines the gap between formal oversight mechanisms and actual police conduct across Kenya, Uganda, Tanzania, and Ethiopia.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Police accountability in East Africa remains a critical deficit. The African Policing Civilian Oversight Forum (APCOF), the continent's primary body on police governance, documents a persistent gap between the legal mandates of civilian oversight institutions and their practical capacity to investigate and sanction misconduct.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "What the Data Shows" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "APCOF's Police Accountability Indicators show that across the five East African countries in our monitoring footprint, fewer than 30% of formal complaints against police officers result in disciplinary proceedings. In Kenya, the Independent Policing Oversight Authority (IPOA) received 8,397 complaints between 2021 and 2023, but concluded fewer than 2,000 investigations — a completion rate constrained by budget limitations and non-cooperation from police commanders.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Patterns of Misconduct" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The most commonly reported categories on WatchTower align with APCOF's typology: excessive force during arrests and demonstrations, arbitrary detention beyond the constitutionally mandated 24-hour limit, extortion at checkpoints, and failure to investigate reported crimes in low-income communities. Custodial deaths — deaths occurring in police cells or during transportation — represent the most severe category and trigger mandatory IPOA investigations in Kenya, yet APCOF notes that scene-of-incident access is routinely denied to oversight investigators.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Structural Barriers to Reform" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "APCOF's research identifies three structural barriers common across the region: first, oversight bodies are chronically underfunded relative to the police services they monitor; second, most oversight mandates exclude intelligence and anti-terrorism units where abuses are most severe; third, there is no regional mechanism for cross-border cooperation when perpetrators move between jurisdictions. WatchTower's incident data reinforces this — incidents reported near border areas in the Kenya-Uganda and Kenya-Ethiopia corridors show significantly lower follow-up rates from oversight bodies.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop",
        imageAlt: "Police accountability and civilian oversight in Africa",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Reading the NELDA Data: What 80 Years of East African Elections Tell Us About Fraud",
        slug: "nelda-east-african-election-fraud-patterns",
        description:
          "The NELDA dataset codes 58 variables for every election in East Africa since 1945. This analysis extracts the patterns most relevant to understanding the types of irregularities being reported on WatchTower today.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The National Elections Across Democracy and Autocracy (NELDA) dataset represents the most systematic attempt to measure election quality globally. For East Africa, it offers a historical baseline against which current incidents — including those being reported on this platform — can be assessed.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Voter Suppression vs. Result Falsification" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "NELDA distinguishes between pre-election manipulation (voter registration interference, candidate exclusion, opposition harassment), voting-day fraud (ballot stuffing, voter intimidation, polling station irregularities), and post-election manipulation (result falsification during tallying). The data shows East African elections have shifted over the past two decades: outright ballot stuffing is less common in countries with stronger observer presence, but pre-election manipulation — particularly registration fraud and harassment of opposition structures — has increased.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "What EISA Observers Document" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The Electoral Institute for Sustainable Democracy in Africa (EISA) deploys long-term observation missions to major East African elections. Their structured reports — available in the WatchTower datasets library — consistently flag three categories of concern: late or unequal distribution of electoral materials to opposition strongholds, intimidation of voters and poll workers by incumbent-aligned groups, and statistical anomalies in results transmission that suggest alterations at aggregation points. Cross-referencing EISA findings with WatchTower incident reports provides community-level corroboration for patterns EISA identifies at an aggregate level.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "The Role of Citizen Reporting" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "What institutional observers cannot provide is granular, real-time documentation from polling stations across thousands of precincts simultaneously. This is where citizen reporting platforms create value that complements NELDA's historical analysis and EISA's expert assessments. The African Union Election Observation Unit has noted in recent reports that community-level reporting, where properly secured and aggregated, can serve as a first-layer detection mechanism for manipulation patterns that only become visible in aggregate.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop",
        imageAlt: "Ballot boxes and election officials in Africa",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Ghost Workers, Inflated Contracts, and Diverted Aid: What Kenya's Auditor General Found in FY2022/23",
        slug: "kenya-auditor-general-findings-2022-23",
        description:
          "The Office of the Auditor General Kenya's 2022/23 reports flagged KES 14.7 billion in irregular expenditures. This analysis unpacks the most significant findings and their relationship to incident patterns on WatchTower.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Every year, Kenya's Auditor General publishes audit reports covering the national government and all 47 county governments. These reports are among the most detailed accountability documents produced by any East African government — and they consistently reveal patterns of misuse of public funds that WatchTower's incident reports corroborate at the community level.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Ghost Workers: A Persistent Problem" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The FY2022/23 audit identified ghost workers — fictitious employees drawing salaries from the public payroll — in 23 of 47 county governments. The combined salary leakage was estimated at KES 1.8 billion annually. WatchTower receives reports from community members who document this at source: witnesses to pay-parade irregularities, healthcare workers aware that absent colleagues continue to draw salaries, and local officials who encounter the phenomenon in their constituencies.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Procurement Irregularities" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The World Bank BOOST data and the Auditor General reports together reveal a consistent pattern: capital budgets for infrastructure are frequently underspent relative to appropriations, while recurrent expenditures — particularly for goods and services — show systematic over-invoicing. The Open Budget Survey scores Kenya 45/100 on budget transparency, reflecting that while budget documents are published, in-year execution reporting remains weak, creating the opacity under which irregular procurement occurs.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Connecting Audit Findings to Community Reports" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "An analysis of WatchTower 'Misuse of Public Funds' reports in counties where the Auditor General issued adverse opinions in FY2022/23 shows a statistically significant correlation. Communities in counties with the worst audit outcomes file disproportionately more reports of incomplete infrastructure projects, non-existent social protection payments, and demands for unofficial fees to access services that should be free. This relationship suggests that citizen-generated incident data and official audit findings can be used as mutual validation tools.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
        imageAlt: "Government financial documents and accountability",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Bribery in Public Services: What the Global Corruption Barometer Says About East Africa",
        slug: "gcb-corruption-barometer-east-africa",
        description:
          "Transparency International's Global Corruption Barometer Africa 2019 found that 47% of East Africans who accessed public services paid a bribe in the past year. This piece examines which services are worst affected and how the data aligns with reports on WatchTower.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The Global Corruption Barometer (GCB) Africa 2019, based on surveys of 47,000 people across 35 countries, remains the most comprehensive measurement of lived bribery experience on the continent. Its findings are stark: in East Africa, the police are consistently identified as the institution most likely to demand a bribe, with rates ranging from 35% in Rwanda to over 60% in Uganda and Kenya among those who had contact with police.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Where Bribes Are Demanded Most" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Beyond police, the GCB identifies identity document services, court officials, and land registry officers as the three next most bribery-prone contact points in East Africa. Afrobarometer's longitudinal data confirms these patterns have remained largely stable across Rounds 7, 8, and 9 (2018–2023), despite multiple anti-corruption campaigns. The Afrobarometer data further shows that citizens who perceive the government as doing a bad job on corruption are significantly more likely to report having paid a bribe — suggesting that impunity perception drives actual bribery rates.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "The Underreporting Problem" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Both the GCB and the Commission on Administrative Justice (CAJ) in Kenya acknowledge severe underreporting of corruption. The GCB found that only 18% of East Africans who paid a bribe reported it to an authority — fear of retaliation and distrust of investigative institutions are the primary barriers. Kenya's CAJ annual reports show that complaint volumes in counties with active civil society organizations are three to four times higher than in counties with weaker civic infrastructure, suggesting the gap is one of access and confidence rather than the absence of incidents.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop",
        imageAlt: "Anti-corruption advocacy and governance accountability",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Petitions to Power: How Kikasha and Charter Project Africa Are Reshaping Civic Demands",
        slug: "kikasha-charter-project-civic-petitions-east-africa",
        description:
          "Digital petitioning platforms are changing how communities in East Africa present formal grievances to government. This analysis draws on Kikasha's petition data and the Charter Project Africa tools to understand what citizens are demanding and what gets a response.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "For much of East Africa's post-independence history, community petitions were handwritten documents delivered in person to local administrators — a process that favored those with literacy, time, and proximity to government offices. Digital petitioning tools are beginning to change this, and the data emerging from platforms like Kikasha reveals what communities most want their governments to address.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "What Kenyan Communities Are Petitioning For" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Kikasha's petition dataset, available in the WatchTower data library, shows that the three most common petition categories in Kenya are: public infrastructure (roads, water, sanitation), accountability for public funds at the county level, and police conduct. The third category directly overlaps with WatchTower's 'Police Misconduct' and 'Misuse of Public Funds' incident types — petitions here represent organized, collective responses to the kinds of incidents reported individually on this platform.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Charter Project Africa's Civic Tech Ecosystem" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The Charter Project Africa Tools Repository documents over 40 civic technology applications deployed across the continent for democratic participation. Its analysis found that digital tools are most effective when they connect individual reporting to collective action — the combination of documenting incidents and aggregating them into formal petitions creates political pressure that neither alone achieves. WatchTower is designed with exactly this architecture: individual reports feed into aggregated analytics that civil society organizations can present to oversight bodies.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "Government Response Rates" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "Kikasha data shows that petitions targeting county governments achieve an official response in approximately 34% of cases, versus 19% for national government petitions. Local proximity matters — but so does media attention. Petitions that receive coverage in regional outlets are four times more likely to receive a formal government response than those that do not. This underscores the importance of civil society organizations using WatchTower data to brief journalists and trigger investigation.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop",
        imageAlt: "Community members engaging with digital civic tools",
        status: "published" as const,
        publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
      {
        title: "The IIAG Governance Scores and What They Miss: A WatchTower Perspective",
        slug: "iiag-governance-scores-watchtower-perspective",
        description:
          "The Ibrahim Index of African Governance measures 96 indicators across 54 countries. This article examines where the IIAG's composite scores align with and diverge from ground-level incident data, and what citizen reporting adds to the governance accountability picture.",
        content: [
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The Ibrahim Index of African Governance (IIAG), published biennially by the Mo Ibrahim Foundation, is the most comprehensive governance assessment on the continent. Using 96 indicators drawn from 35+ international data providers, it ranks all 54 African countries across four dimensions: Security and Rule of Law, Participation and Human Rights, Sustainable Economic Opportunity, and Human Development.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "What the IIAG Captures Well" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The IIAG excels at tracking structural governance quality over time. It captures Rwanda's sustained improvements in rule of law institutions, Kenya's volatile trajectory on participation rights, and Ethiopia's sharp deterioration in security conditions after 2018. For longitudinal trend analysis and cross-country comparison, it is unmatched on the continent.",
              },
            ],
          },
          {
            _type: "block",
            style: "h2",
            children: [{ text: "What It Cannot Capture" }],
          },
          {
            _type: "block",
            style: "normal",
            children: [
              {
                text: "The IIAG's 96 indicators are almost entirely sourced from expert surveys, institutional assessments, and official data — not from citizens' direct experiences. This creates a documented blind spot: countries can score well on formal institutional indicators while performing poorly on lived experience metrics. Kenya's IIAG score for Rule of Law has improved over the past decade, yet WatchTower reports and the GCB data show that bribery rates and police misconduct remain consistently high. The IIAG measures whether oversight institutions exist; WatchTower measures whether they work.",
              },
            ],
          },
        ],
        authorId: firstUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
        imageAlt: "Data visualization and governance analytics",
        status: "draft" as const,
        publishedAt: null,
      },
    ];

    const createdInsights = await db
      .insert(insights)
      .values(insightsData)
      .onConflictDoNothing()
      .returning();
    console.log(`✅ Inserted ${createdInsights.length} insights (skipped existing)`);

    const tag = (slug: string) => {
      const t = createdTags.find((x) => x.slug === slug);
      if (!t) throw new Error(`Tag not found: ${slug}`);
      return t.id;
    };

    const tagRelations = [
      // Police accountability insight
      { insightId: createdInsights[0].id, tagId: tag("police-accountability") },
      { insightId: createdInsights[0].id, tagId: tag("human-rights") },
      { insightId: createdInsights[0].id, tagId: tag("east-africa") },

      // NELDA election insight
      { insightId: createdInsights[1].id, tagId: tag("election-integrity") },
      { insightId: createdInsights[1].id, tagId: tag("governance") },
      { insightId: createdInsights[1].id, tagId: tag("data-evidence") },

      // Auditor General insight
      { insightId: createdInsights[2].id, tagId: tag("public-finance") },
      { insightId: createdInsights[2].id, tagId: tag("anti-corruption") },
      { insightId: createdInsights[2].id, tagId: tag("east-africa") },

      // GCB corruption insight
      { insightId: createdInsights[3].id, tagId: tag("anti-corruption") },
      { insightId: createdInsights[3].id, tagId: tag("governance") },
      { insightId: createdInsights[3].id, tagId: tag("data-evidence") },

      // Kikasha petitions insight
      { insightId: createdInsights[4].id, tagId: tag("civic-participation") },
      { insightId: createdInsights[4].id, tagId: tag("east-africa") },
      { insightId: createdInsights[4].id, tagId: tag("governance") },

      // IIAG insight
      { insightId: createdInsights[5].id, tagId: tag("governance") },
      { insightId: createdInsights[5].id, tagId: tag("research") },
      { insightId: createdInsights[5].id, tagId: tag("data-evidence") },
    ];

    if (tagRelations.length > 0) {
      await db.insert(insightTagRelations).values(tagRelations).onConflictDoNothing();
      console.log(`✅ Created ${tagRelations.length} tag relations`);
    } else {
      console.log("⚠️ No new insights inserted, skipping tag relations");
    }

    console.log("🎉 Insights seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding insights:", error);
    throw error;
  }
}

seedInsights()
  .then(() => {
    console.log("✨ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });
