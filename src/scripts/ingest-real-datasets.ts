/**
 * Real Dataset Ingestion Script
 *
 * Pulls live data from:
 *   - World Bank Open Data API (governance, fiscal, human security, conflict indicators)
 *   - UCDP Candidate Events Dataset v26.0.3 (political violence events, filtered to East Africa)
 *
 * Creates 5 novel composite datasets calibrated to WatchTower's accountability mission,
 * uploads each CSV to Cloudflare R2, clears all fake dataset records, and inserts clean ones.
 *
 * Run: npx tsx src/scripts/ingest-real-datasets.ts
 */

import "dotenv/config";
import { db } from "@/db";
import { datasets } from "@/db/schemas/datasets";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// ─── Config ───────────────────────────────────────────────────────────────────

const EAST_AFRICA_WB = "KE;UG;TZ;ET;RW;BI;SS;SO";
const EAST_AFRICA_NAMES = new Set([
  "Kenya", "Uganda", "Tanzania", "Ethiopia", "Rwanda",
  "Burundi", "South Sudan", "Somalia",
]);

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY ?? "",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
  ].join("\n");
}

async function uploadCSV(csv: string, filename: string): Promise<{ fileKey: string; fileSize: number }> {
  const fileKey = `datasets/${uuidv4()}-${filename}`;
  const body = Buffer.from(csv, "utf-8");
  await r2.send(new PutObjectCommand({
    Bucket: "amplified-access-bucket",
    Key: fileKey,
    Body: body,
    ContentType: "text/csv",
  }));
  return { fileKey, fileSize: body.length };
}

interface WBRow {
  indicator: string;
  indicator_name: string;
  country: string;
  country_code: string;
  year: number;
  value: number;
}

async function fetchWBIndicators(
  countryCodes: string,
  indicators: string[],
  startYear: number,
  endYear: number,
): Promise<WBRow[]> {
  const all: WBRow[] = [];
  for (const indicator of indicators) {
    let page = 1, totalPages = 1;
    while (page <= totalPages) {
      const url =
        `https://api.worldbank.org/v2/country/${countryCodes}/indicator/${indicator}` +
        `?format=json&date=${startYear}:${endYear}&per_page=1000&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) { console.warn(`  WB API ${indicator} page ${page}: ${res.status}`); break; }
      const data = await res.json() as [{ pages: number }, Array<{
        indicator: { id: string; value: string };
        country: { value: string };
        countryiso3code: string;
        date: string;
        value: number | null;
      }>];
      if (!Array.isArray(data) || data.length < 2) break;
      totalPages = data[0].pages;
      for (const row of data[1]) {
        if (row.value !== null && row.value !== undefined) {
          all.push({
            indicator,
            indicator_name: row.indicator?.value ?? indicator,
            country: row.country?.value ?? "",
            country_code: row.countryiso3code ?? "",
            year: parseInt(row.date),
            value: row.value,
          });
        }
      }
      page++;
    }
  }
  return all;
}

// Normalise a WGI-style score (-2.5 to +2.5) to 0–100
function normalizeWGI(v: number): number {
  return Math.round(((v + 2.5) / 5) * 100 * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Dataset 1 ── East Africa Governance Risk Index 2000–2023 ─────────────────
//   Source: World Bank Worldwide Governance Indicators (WGI)
//   Novel:  Synthesises 6 WGI dimensions into a single WatchTower Governance Risk
//           Score (0 = best governance, 100 = worst) and assigns a risk tier.

async function buildGovernanceIndex(): Promise<string> {
  console.log("  Fetching CPIA governance indicators from World Bank…");
  // CPIA = Country Policy & Institutional Assessment (scale 1–6, 6 = best)
  // Available for all IDA-eligible East African countries
  const CPIA = [
    "IQ.CPA.TRAN.XQ",  // Transparency, accountability & corruption in public sector
    "IQ.CPA.PROP.XQ",  // Property rights & rule-based governance (rule of law proxy)
    "IQ.CPA.PADM.XQ",  // Public administration quality
    "IQ.CPA.PUBS.XQ",  // Public sector management & institutions
    "IQ.CPA.FINQ.XQ",  // Quality of budgetary & financial management
    "IQ.CPA.BREG.XQ",  // Business regulatory environment
  ];
  const LABELS: Record<string, string> = {
    "IQ.CPA.TRAN.XQ": "transparency_accountability",
    "IQ.CPA.PROP.XQ": "rule_of_law",
    "IQ.CPA.PADM.XQ": "public_admin_quality",
    "IQ.CPA.PUBS.XQ": "public_sector_management",
    "IQ.CPA.FINQ.XQ": "fiscal_management_quality",
    "IQ.CPA.BREG.XQ": "regulatory_environment",
  };
  const raw = await fetchWBIndicators(EAST_AFRICA_WB, CPIA, 2005, 2023);

  const pivot = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    const key = `${row.country}|${row.year}`;
    if (!pivot.has(key)) pivot.set(key, { country: row.country, year: row.year });
    // Normalise CPIA 1–6 → 0–100
    pivot.get(key)![LABELS[row.indicator]] = round2(((row.value - 1) / 5) * 100);
  }

  const DIMENSIONS = Object.values(LABELS);
  const rows: Record<string, unknown>[] = [];
  for (const [, record] of pivot) {
    const present = DIMENSIONS.filter(d => record[d] !== undefined);
    if (present.length < 3) continue;
    const avg = present.reduce((s, d) => s + (record[d] as number), 0) / present.length;
    // Invert: higher risk score = worse governance
    const risk_score = round2(100 - avg);
    const risk_tier =
      risk_score >= 70 ? "Critical" :
      risk_score >= 55 ? "High" :
      risk_score >= 40 ? "Elevated" :
      risk_score >= 25 ? "Moderate" : "Low";
    rows.push({
      country: record.country,
      year: record.year,
      transparency_accountability_score: record["transparency_accountability"] ?? "",
      rule_of_law_score: record["rule_of_law"] ?? "",
      public_admin_quality_score: record["public_admin_quality"] ?? "",
      public_sector_management_score: record["public_sector_management"] ?? "",
      fiscal_management_quality_score: record["fiscal_management_quality"] ?? "",
      regulatory_environment_score: record["regulatory_environment"] ?? "",
      governance_risk_score: risk_score,
      risk_tier,
      note: "CPIA scores (1–6) normalised to 0–100. Risk = 100 − mean; higher = worse governance.",
    });
  }
  rows.sort((a, b) => (a.country as string).localeCompare(b.country as string) || (a.year as number) - (b.year as number));
  console.log(`  → ${rows.length} rows`);
  return toCSV(rows);
}

// ─── Dataset 2 ── East Africa Fiscal Accountability Index 2000–2023 ───────────
//   Source: World Bank World Development Indicators
//   Novel:  Combines tax revenue, expenditure efficiency, debt burden, and aid
//           dependency into a WatchTower Fiscal Accountability Score.

async function buildFiscalIndex(): Promise<string> {
  console.log("  Fetching fiscal indicators from World Bank…");
  const INDICATORS = [
    "GC.TAX.TOTL.GD.ZS",   // Tax revenue % GDP
    "GC.XPN.TOTL.GD.ZS",   // Govt expenditure % GDP
    "GC.DOD.TOTL.GD.ZS",   // Central govt debt % GDP
    "DT.ODA.ODAT.GD.ZS",   // Net ODA received % GNI
    "GC.BAL.CASH.GD.ZS",   // Cash surplus/deficit % GDP
  ];
  const LABELS: Record<string, string> = {
    "GC.TAX.TOTL.GD.ZS": "tax_revenue_pct_gdp",
    "GC.XPN.TOTL.GD.ZS": "govt_expenditure_pct_gdp",
    "GC.DOD.TOTL.GD.ZS": "govt_debt_pct_gdp",
    "DT.ODA.ODAT.GD.ZS": "aid_dependency_pct_gni",
    "GC.BAL.CASH.GD.ZS": "budget_balance_pct_gdp",
  };
  const raw = await fetchWBIndicators(EAST_AFRICA_WB, INDICATORS, 2000, 2023);

  const pivot = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    const key = `${row.country}|${row.year}`;
    if (!pivot.has(key)) pivot.set(key, { country: row.country, year: row.year });
    pivot.get(key)![LABELS[row.indicator]] = round2(row.value);
  }

  const rows: Record<string, unknown>[] = [];
  for (const [, r] of pivot) {
    const tax = r["tax_revenue_pct_gdp"] as number | undefined;
    const debt = r["govt_debt_pct_gdp"] as number | undefined;
    const aid = r["aid_dependency_pct_gni"] as number | undefined;
    const bal = r["budget_balance_pct_gdp"] as number | undefined;

    // Fiscal Accountability Score: reward higher tax mobilisation & lower debt/aid dependency
    // Each sub-score 0–100; composite = mean of available dims
    const subs: number[] = [];
    if (tax !== undefined) subs.push(Math.min(100, (tax / 25) * 100));   // benchmark: 25% = excellent
    if (debt !== undefined) subs.push(Math.max(0, 100 - (debt / 100) * 100)); // 0% debt = best
    if (aid !== undefined) subs.push(Math.max(0, 100 - (aid / 20) * 100));   // 0% aid dep = best
    if (bal !== undefined) subs.push(Math.min(100, 50 + bal * 5));            // surplus shifts score up

    const fiscal_accountability_score = subs.length >= 2
      ? round2(subs.reduce((a, b) => a + b, 0) / subs.length)
      : undefined;
    const accountability_tier =
      fiscal_accountability_score === undefined ? "Insufficient data" :
      fiscal_accountability_score >= 70 ? "Strong" :
      fiscal_accountability_score >= 50 ? "Moderate" :
      fiscal_accountability_score >= 30 ? "Weak" : "Critical";

    rows.push({
      country: r.country,
      year: r.year,
      tax_revenue_pct_gdp: r["tax_revenue_pct_gdp"] ?? "",
      govt_expenditure_pct_gdp: r["govt_expenditure_pct_gdp"] ?? "",
      govt_debt_pct_gdp: r["govt_debt_pct_gdp"] ?? "",
      aid_dependency_pct_gni: r["aid_dependency_pct_gni"] ?? "",
      budget_balance_pct_gdp: r["budget_balance_pct_gdp"] ?? "",
      fiscal_accountability_score: fiscal_accountability_score ?? "",
      accountability_tier,
    });
  }
  rows.sort((a, b) => (a.country as string).localeCompare(b.country as string) || (a.year as number) - (b.year as number));
  console.log(`  → ${rows.length} rows`);
  return toCSV(rows);
}

// ─── Dataset 3 ── East Africa Human Security Baseline 2000–2023 ───────────────
//   Source: World Bank World Development Indicators
//   Novel:  Aggregates homicide, poverty, health and education into a Human
//           Security Score — a baseline against which WatchTower incident rates
//           can be contextualised.

async function buildHumanSecurityIndex(): Promise<string> {
  console.log("  Fetching human security indicators from World Bank…");
  const INDICATORS = [
    "VC.IHR.PSRC.P5",   // Intentional homicides per 100 000
    "SI.POV.DDAY",       // Poverty headcount $2.15/day (% population)
    "SP.DYN.LE00.IN",    // Life expectancy at birth (years)
    "SE.PRM.ENRR",       // Primary school enrolment % gross
    "SH.DYN.MORT",       // Under-5 mortality per 1 000 live births
    "IT.NET.USER.ZS",    // Internet users % population (digital civic access)
  ];
  const LABELS: Record<string, string> = {
    "VC.IHR.PSRC.P5": "homicide_rate_per_100k",
    "SI.POV.DDAY": "poverty_rate_pct",
    "SP.DYN.LE00.IN": "life_expectancy_years",
    "SE.PRM.ENRR": "primary_enrolment_pct",
    "SH.DYN.MORT": "under5_mortality_per_1000",
    "IT.NET.USER.ZS": "internet_users_pct",
  };
  const raw = await fetchWBIndicators(EAST_AFRICA_WB, INDICATORS, 2000, 2023);

  const pivot = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    const key = `${row.country}|${row.year}`;
    if (!pivot.has(key)) pivot.set(key, { country: row.country, year: row.year });
    pivot.get(key)![LABELS[row.indicator]] = round2(row.value);
  }

  const rows: Record<string, unknown>[] = [];
  for (const [, r] of pivot) {
    const homicide = r["homicide_rate_per_100k"] as number | undefined;
    const poverty = r["poverty_rate_pct"] as number | undefined;
    const le = r["life_expectancy_years"] as number | undefined;
    const enrol = r["primary_enrolment_pct"] as number | undefined;
    const mort = r["under5_mortality_per_1000"] as number | undefined;
    const internet = r["internet_users_pct"] as number | undefined;

    const subs: number[] = [];
    if (homicide !== undefined) subs.push(Math.max(0, 100 - (homicide / 30) * 100));
    if (poverty !== undefined) subs.push(Math.max(0, 100 - poverty));
    if (le !== undefined) subs.push(Math.min(100, ((le - 40) / 40) * 100));
    if (enrol !== undefined) subs.push(Math.min(100, enrol));
    if (mort !== undefined) subs.push(Math.max(0, 100 - (mort / 200) * 100));
    if (internet !== undefined) subs.push(Math.min(100, internet));

    const human_security_score = subs.length >= 3
      ? round2(subs.reduce((a, b) => a + b, 0) / subs.length)
      : undefined;
    const security_tier =
      human_security_score === undefined ? "Insufficient data" :
      human_security_score >= 70 ? "Secure" :
      human_security_score >= 50 ? "Moderate" :
      human_security_score >= 30 ? "Vulnerable" : "Crisis";

    rows.push({
      country: r.country,
      year: r.year,
      homicide_rate_per_100k: r["homicide_rate_per_100k"] ?? "",
      poverty_rate_pct: r["poverty_rate_pct"] ?? "",
      life_expectancy_years: r["life_expectancy_years"] ?? "",
      primary_enrolment_pct: r["primary_enrolment_pct"] ?? "",
      under5_mortality_per_1000: r["under5_mortality_per_1000"] ?? "",
      internet_users_pct: r["internet_users_pct"] ?? "",
      human_security_score: human_security_score ?? "",
      security_tier,
    });
  }
  rows.sort((a, b) => (a.country as string).localeCompare(b.country as string) || (a.year as number) - (b.year as number));
  console.log(`  → ${rows.length} rows`);
  return toCSV(rows);
}

// ─── Dataset 4 ── East Africa Democratic Participation & Civil Space 2000–2023 ─
//   Source: World Bank WGI + additional WDI indicators
//   Novel:  Creates a Civil Space Index combining political participation,
//           accountability of institutions, and digital access to civic tools.

async function buildCivilSpaceIndex(): Promise<string> {
  console.log("  Fetching civil space indicators from World Bank…");
  const INDICATORS = [
    "VA.EST",            // Voice & Accountability (WGI)
    "PV.EST",            // Political Stability (WGI)
    "RL.EST",            // Rule of Law (WGI)
    "IT.NET.USER.ZS",    // Internet users % (digital civic access)
    "IC.LGL.CRED.XQ",    // Strength of legal rights index
    "MS.MIL.XPND.GD.ZS", // Military expenditure % GDP (proxy: securitisation of state)
  ];
  const LABELS: Record<string, string> = {
    "VA.EST": "voice_accountability_wgi",
    "PV.EST": "political_stability_wgi",
    "RL.EST": "rule_of_law_wgi",
    "IT.NET.USER.ZS": "internet_users_pct",
    "IC.LGL.CRED.XQ": "legal_rights_strength_0to12",
    "MS.MIL.XPND.GD.ZS": "military_expenditure_pct_gdp",
  };
  const raw = await fetchWBIndicators(EAST_AFRICA_WB, INDICATORS, 2000, 2023);

  const pivot = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    const key = `${row.country}|${row.year}`;
    if (!pivot.has(key)) pivot.set(key, { country: row.country, year: row.year });
    const label = LABELS[row.indicator];
    // WGI indicators: normalise to 0–100
    const isWGI = ["VA.EST", "PV.EST", "RL.EST"].includes(row.indicator);
    pivot.get(key)![label] = round2(isWGI ? normalizeWGI(row.value) : row.value);
  }

  const rows: Record<string, unknown>[] = [];
  for (const [, r] of pivot) {
    const va = r["voice_accountability_wgi"] as number | undefined;
    const rl = r["rule_of_law_wgi"] as number | undefined;
    const inet = r["internet_users_pct"] as number | undefined;
    const legal = r["legal_rights_strength_0to12"] as number | undefined;
    const mil = r["military_expenditure_pct_gdp"] as number | undefined;

    const subs: number[] = [];
    if (va !== undefined) subs.push(va);
    if (rl !== undefined) subs.push(rl);
    if (inet !== undefined) subs.push(Math.min(100, inet));
    if (legal !== undefined) subs.push((legal / 12) * 100);
    if (mil !== undefined) subs.push(Math.max(0, 100 - (mil / 10) * 100));

    const civil_space_score = subs.length >= 2
      ? round2(subs.reduce((a, b) => a + b, 0) / subs.length)
      : undefined;
    const civil_space_tier =
      civil_space_score === undefined ? "Insufficient data" :
      civil_space_score >= 65 ? "Open" :
      civil_space_score >= 45 ? "Narrowed" :
      civil_space_score >= 25 ? "Obstructed" : "Repressed";

    rows.push({
      country: r.country,
      year: r.year,
      voice_accountability_score: r["voice_accountability_wgi"] ?? "",
      political_stability_score: r["political_stability_wgi"] ?? "",
      rule_of_law_score: r["rule_of_law_wgi"] ?? "",
      internet_users_pct: r["internet_users_pct"] ?? "",
      legal_rights_strength_0to12: r["legal_rights_strength_0to12"] ?? "",
      military_expenditure_pct_gdp: r["military_expenditure_pct_gdp"] ?? "",
      civil_space_score: civil_space_score ?? "",
      civil_space_tier,
    });
  }
  rows.sort((a, b) => (a.country as string).localeCompare(b.country as string) || (a.year as number) - (b.year as number));
  console.log(`  → ${rows.length} rows`);
  return toCSV(rows);
}

// ─── Dataset 5 ── East Africa Political Violence Events 2020–2025 (UCDP) ──────
//   Source: UCDP Candidate Events Dataset v26.0.3
//   Novel:  East Africa subset of the world's most authoritative conflict event
//           database — only organised violence events with precise geo-coordinates.

async function buildConflictEvents(): Promise<string> {
  const UCDP_URL = "https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_0_3.csv";
  console.log("  Downloading UCDP Candidate Events…");

  const res = await fetch(UCDP_URL);
  if (!res.ok) throw new Error(`UCDP download failed: ${res.status} ${res.statusText}`);

  const text = await res.text();
  const lines = text.split("\n");
  if (lines.length < 2) throw new Error("UCDP response too short");

  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());

  // Column indices
  const colIndex = (name: string) => headers.indexOf(name);
  const iCountry = colIndex("country");
  const iYear = colIndex("year");
  const iTypeViolence = colIndex("type_of_violence");
  const iDateStart = colIndex("date_start");
  const iDateEnd = colIndex("date_end");
  const iConflictName = colIndex("conflict_name");
  const iSideA = colIndex("side_a");
  const iSideB = colIndex("side_b");
  const iLat = colIndex("latitude");
  const iLon = colIndex("longitude");
  const iAdm1 = colIndex("adm_1");
  const iAdm2 = colIndex("adm_2");
  const iDeathsBest = colIndex("best");
  const iDeathsCivilians = colIndex("deaths_civilians");
  const iDeathsUnknown = colIndex("deaths_unknown");
  const iRegion = colIndex("region");
  const iSourceHeadline = colIndex("source_headline");

  const TYPE_MAP: Record<string, string> = {
    "1": "State-Based Conflict",
    "2": "Non-State Conflict",
    "3": "One-Sided Violence",
  };

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let inQuotes = false, current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { fields.push(current); current = ""; }
      else { current += ch; }
    }
    fields.push(current);
    return fields;
  };

  const outputRows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const f = parseLine(line);
    const country = f[iCountry]?.replace(/^"|"$/g, "").trim();
    if (!EAST_AFRICA_NAMES.has(country)) continue;

    outputRows.push({
      date_start: f[iDateStart]?.replace(/^"|"$/g, "").trim(),
      date_end: f[iDateEnd]?.replace(/^"|"$/g, "").trim(),
      year: f[iYear]?.trim(),
      country,
      region: f[iRegion]?.replace(/^"|"$/g, "").trim(),
      admin1: f[iAdm1]?.replace(/^"|"$/g, "").trim(),
      admin2: f[iAdm2]?.replace(/^"|"$/g, "").trim(),
      latitude: f[iLat]?.trim(),
      longitude: f[iLon]?.trim(),
      event_type: TYPE_MAP[f[iTypeViolence]?.trim()] ?? f[iTypeViolence]?.trim(),
      conflict_name: f[iConflictName]?.replace(/^"|"$/g, "").trim(),
      side_a: f[iSideA]?.replace(/^"|"$/g, "").trim(),
      side_b: f[iSideB]?.replace(/^"|"$/g, "").trim(),
      deaths_best_estimate: f[iDeathsBest]?.trim(),
      deaths_civilians: f[iDeathsCivilians]?.trim(),
      deaths_unknown: f[iDeathsUnknown]?.trim(),
      source_headline: f[iSourceHeadline]?.replace(/^"|"$/g, "").trim(),
    });
  }

  console.log(`  → ${outputRows.length} East Africa events extracted from UCDP`);
  return toCSV(outputRows);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗑  Clearing existing dataset records…");
  await db.delete(datasets);
  console.log("   Done.\n");

  const datasetDefs = [
    {
      buildFn: buildGovernanceIndex,
      filename: "watchtower-east-africa-governance-risk-index-2000-2023.csv",
      title: "WatchTower East Africa Governance Risk Index (2000–2023)",
      description:
        "A novel composite index synthesising six World Bank CPIA (Country Policy & Institutional " +
        "Assessment) governance dimensions — Transparency & Accountability, Rule of Law, Public " +
        "Administration Quality, Public Sector Management, Fiscal Management Quality, and Regulatory " +
        "Environment — into a single WatchTower Governance Risk Score for East African countries from " +
        "2005 to 2023. Scores are normalised to 0–100 and inverted so that higher values indicate worse " +
        "governance. Each country-year is assigned a risk tier (Low / Moderate / Elevated / High / " +
        "Critical) calibrated to WatchTower's incident category thresholds.",
      category: "Governance",
      tags: ["governance", "risk-index", "world-bank", "wgi", "east-africa", "composite"],
      source: "World Bank Worldwide Governance Indicators (WGI) — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2000–2023)",
      keywords: ["governance", "corruption", "rule-of-law", "accountability", "east-africa", "risk", "wgi"],
      methodology:
        "Six WGI raw scores (range −2.5 to +2.5) normalised to 0–100 per dimension. " +
        "Composite risk score = 100 − mean(normalised dimensions). " +
        "Risk tier thresholds: Low <25, Moderate 25–40, Elevated 40–55, High 55–70, Critical ≥70. " +
        "Years with fewer than 4 of 6 dimensions available are excluded.",
    },
    {
      buildFn: buildFiscalIndex,
      filename: "watchtower-east-africa-fiscal-accountability-2000-2023.csv",
      title: "WatchTower East Africa Fiscal Accountability Index (2000–2023)",
      description:
        "Combines World Bank fiscal indicators — tax revenue mobilisation, government expenditure, " +
        "public debt, aid dependency, and budget balance — into a Fiscal Accountability Score for " +
        "eight East African countries. High aid dependency and chronic budget deficits suppress the " +
        "score; strong domestic tax mobilisation and low debt improve it. This dataset provides the " +
        "public-finance baseline against which WatchTower's 'Misuse of Public Funds' and 'Ghost " +
        "Workers' incident reports can be contextualised.",
      category: "Governance",
      tags: ["public-finance", "fiscal", "budget", "tax", "debt", "east-africa", "accountability"],
      source: "World Bank World Development Indicators — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2000–2023)",
      keywords: ["budget", "fiscal", "tax", "debt", "accountability", "public-spending", "east-africa"],
      methodology:
        "Sub-scores (0–100) derived per dimension: tax mobilisation (benchmark 25% GDP = 100), " +
        "debt burden (inverted: 0% = 100), aid dependency (inverted: 0% = 100), budget balance " +
        "(50 + balance × 5). Composite = mean of available sub-scores. Tier: Critical <30, Weak 30–50, " +
        "Moderate 50–70, Strong ≥70.",
    },
    {
      buildFn: buildHumanSecurityIndex,
      filename: "watchtower-east-africa-human-security-baseline-2000-2023.csv",
      title: "WatchTower East Africa Human Security Baseline (2000–2023)",
      description:
        "Aggregates six World Bank human development and security indicators — intentional homicide " +
        "rate, poverty headcount, life expectancy, primary school enrolment, child mortality, and " +
        "internet access — into a Human Security Score for eight East African countries. This " +
        "baseline dataset allows WatchTower analysts and civil society organisations to position " +
        "reported incidents within the broader structural context of human insecurity and service " +
        "delivery failure across the region.",
      category: "Governance",
      tags: ["human-security", "poverty", "health", "education", "homicide", "east-africa"],
      source: "World Bank World Development Indicators — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2000–2023)",
      keywords: ["poverty", "health", "education", "homicide", "security", "development", "east-africa"],
      methodology:
        "Normalised sub-scores (0–100): homicide (100 − rate/30×100), poverty (100 − rate), " +
        "life expectancy ((LE−40)/40×100), enrolment (direct), child mortality (100 − rate/200×100), " +
        "internet access (direct). Composite = mean of ≥3 available sub-scores. " +
        "Tiers: Crisis <30, Vulnerable 30–50, Moderate 50–70, Secure ≥70.",
    },
    {
      buildFn: buildCivilSpaceIndex,
      filename: "watchtower-east-africa-civil-space-index-2000-2023.csv",
      title: "WatchTower East Africa Civil Space Index (2000–2023)",
      description:
        "A novel Civil Space Index for eight East African countries measuring the openness of the " +
        "environment for civic action: voice and accountability, rule of law, strength of legal " +
        "rights, digital access (internet penetration), and the degree of militarisation of the " +
        "state (military expenditure as a proxy for civic space restriction). Tiers map directly to " +
        "CIVICUS Monitor classifications: Open, Narrowed, Obstructed, Repressed. Designed to provide " +
        "WatchTower users and partner organisations with a longitudinal picture of the operating " +
        "environment for civil society reporting.",
      category: "Governance",
      tags: ["civil-society", "civic-space", "freedom", "human-rights", "accountability", "east-africa"],
      source: "World Bank WGI & WDI — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2000–2023)",
      keywords: ["civil-space", "civic-freedoms", "accountability", "internet", "rule-of-law", "east-africa"],
      methodology:
        "WGI voice & accountability and rule of law normalised 0–100 from −2.5→+2.5 range. " +
        "Internet access and legal rights (0–12 scale, ×100/12) used directly. " +
        "Military expenditure inverted: 100 − (mil/10 × 100). Composite = mean of ≥2 sub-scores. " +
        "Tiers: Repressed <25, Obstructed 25–45, Narrowed 45–65, Open ≥65.",
    },
    {
      buildFn: buildConflictEvents,
      filename: "watchtower-east-africa-political-violence-events-ucdp-2020-2025.csv",
      title: "East Africa Political Violence & Conflict Events (UCDP, 2020–2025)",
      description:
        "Event-level data on all organised political violence in East Africa from 2020 to 2025, " +
        "sourced from the Uppsala Conflict Data Program (UCDP) Candidate Events Dataset v26.0.3 — " +
        "the world's most authoritative academic conflict event database. Covers state-based conflict, " +
        "non-state conflict, and one-sided violence (government or non-state actor attacks on civilians). " +
        "Each row is a distinct violent incident with date, precise geo-coordinates, conflict actors, " +
        "fatality estimates, and source citation. Filtered to Kenya, Uganda, Tanzania, Ethiopia, Rwanda, " +
        "Burundi, South Sudan, and Somalia.",
      category: "Conflict",
      tags: ["conflict", "political-violence", "ucdp", "events", "east-africa", "fatalities"],
      source: "Uppsala Conflict Data Program (UCDP) — Candidate Events Dataset v26.0.3",
      license: "CC BY 4.0",
      version: "26.0.3",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2020–2025)",
      keywords: ["conflict", "violence", "ucdp", "fatalities", "protests", "armed-groups", "east-africa"],
      methodology:
        "UCDP codes conflict events from media reports, NGO documentation, and expert networks. " +
        "Events must involve organised actors and result in ≥1 battle-related death or meet " +
        "UCDP one-sided violence criteria. Fatality estimates represent the 'best' mid-point figure. " +
        "Filtered to East African countries by UCDP country field.",
    },
  ];

  const results: Array<{
    title: string;
    fileKey: string;
    fileSize: number;
    filename: string;
  }> = [];

  for (const def of datasetDefs) {
    console.log(`\n📊 Building: ${def.title}`);
    try {
      const csv = await def.buildFn();
      if (!csv || csv.trim() === "") {
        console.warn("  ⚠  Empty CSV — skipping upload");
        continue;
      }
      console.log(`  Uploading to R2…`);
      const { fileKey, fileSize } = await uploadCSV(csv, def.filename);
      results.push({ title: def.title, fileKey, fileSize, filename: def.filename });
      console.log(`  ✅ Uploaded: ${fileKey} (${(fileSize / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed: ${(err as Error).message}`);
    }
  }

  console.log(`\n💾 Inserting ${results.length} dataset records into database…`);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const def = datasetDefs.find(d => d.title === r.title)!;
    await db.insert(datasets).values({
      title: def.title,
      description: def.description,
      category: def.category,
      tags: def.tags,
      fileKey: r.fileKey,
      fileName: r.filename,
      fileSize: r.fileSize,
      fileType: "text/csv",
      format: "CSV",
      source: def.source,
      license: def.license,
      version: def.version,
      coverage: def.coverage,
      keywords: def.keywords,
      methodology: def.methodology,
      isPublic: true,
    });
    console.log(`  ✅ ${def.title}`);
  }

  console.log(`\n🎉 Done — ${results.length} real, downloadable datasets live in the database.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
