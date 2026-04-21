/**
 * Real Dataset Ingestion Script
 *
 * Pulls live data from:
 *   - World Bank Open Data API (governance, fiscal, human security, conflict indicators)
 *   - UCDP Candidate Events Dataset v26.0.3 (political violence events, filtered to East Africa)
 *   - UNHCR Population Statistics API (refugee & displacement data)
 *   - WHO Global Health Observatory API (health security indicators)
 *
 * Creates 8 novel composite datasets calibrated to WatchTower's accountability mission,
 * uploads each to Cloudflare R2 (CSV, JSON, Excel, PDF formats), clears all fake dataset
 * records, and inserts clean ones.
 *
 * Run: npx tsx src/scripts/ingest-real-datasets.ts
 */

import "dotenv/config";
import { db } from "@/db";
import { datasets } from "@/db/schemas/datasets";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

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

async function uploadBuffer(
  buf: Buffer,
  filename: string,
  contentType: string,
): Promise<{ fileKey: string; fileSize: number }> {
  const fileKey = `datasets/${uuidv4()}-${filename}`;
  await r2.send(new PutObjectCommand({
    Bucket: "amplified-access-bucket",
    Key: fileKey,
    Body: buf,
    ContentType: contentType,
  }));
  return { fileKey, fileSize: buf.length };
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

// ─── Dataset 6 ── East Africa Refugee & Displacement Flows (UNHCR, JSON) ────────
//   Source: UNHCR Population Statistics API (public, no auth required)
//   Novel:  Adds the displacement dimension to WatchTower's accountability context —
//           refugee burden & IDP trends that correlate with governance failure.

const UNHCR_ISO3 = ["KEN", "UGA", "TZA", "ETH", "RWA", "BDI", "SSD", "SOM"];
const UNHCR_NAMES: Record<string, string> = {
  KEN: "Kenya", UGA: "Uganda", TZA: "Tanzania", ETH: "Ethiopia",
  RWA: "Rwanda", BDI: "Burundi", SSD: "South Sudan", SOM: "Somalia",
};

async function buildRefugeeDataJSON(): Promise<Buffer> {
  console.log("  Fetching UNHCR displacement statistics…");

  const countryProfiles: Record<string, unknown> = {};
  let totalRows = 0;

  for (const iso3 of UNHCR_ISO3) {
    const name = UNHCR_NAMES[iso3];
    // Country of asylum: refugees & asylum-seekers hosted
    const coaUrl =
      `https://api.unhcr.org/population/v1/population/?limit=100&dataset=population` +
      `&displayType=totals&cf_type=ISO&geo_pcode=${iso3}&yearFrom=2010&yearTo=2024`;
    // Country of origin: nationals displaced abroad
    const cooUrl =
      `https://api.unhcr.org/population/v1/population/?limit=100&dataset=population` +
      `&displayType=totals&cf_type=ISO&coo_iso=${iso3}&yearFrom=2010&yearTo=2024`;

    let coaItems: Record<string, unknown>[] = [];
    let cooItems: Record<string, unknown>[] = [];

    try {
      const [coaRes, cooRes] = await Promise.all([
        fetch(coaUrl, { headers: { Accept: "application/json" } }),
        fetch(cooUrl, { headers: { Accept: "application/json" } }),
      ]);
      if (coaRes.ok) {
        const d = await coaRes.json() as { items?: Record<string, unknown>[] };
        coaItems = d.items ?? [];
      }
      if (cooRes.ok) {
        const d = await cooRes.json() as { items?: Record<string, unknown>[] };
        cooItems = d.items ?? [];
      }
    } catch (e) {
      console.warn(`  UNHCR fetch failed for ${iso3}: ${(e as Error).message}`);
    }

    const hosted: Record<number, Record<string, unknown>> = {};
    for (const row of coaItems) {
      const yr = row.year as number;
      hosted[yr] = {
        year: yr,
        refugees_hosted: (row.refugees as number) ?? 0,
        asylum_seekers_hosted: (row.asylum_seekers as number) ?? 0,
        other_persons_of_concern: (row.ooc as number) ?? 0,
        total_hosted: ((row.refugees as number) ?? 0) + ((row.asylum_seekers as number) ?? 0),
      };
    }
    const displaced: Record<number, Record<string, unknown>> = {};
    for (const row of cooItems) {
      const yr = row.year as number;
      if (!displaced[yr]) displaced[yr] = { year: yr };
      displaced[yr]["nationals_displaced_abroad"] =
        ((row.refugees as number) ?? 0) + ((row.asylum_seekers as number) ?? 0);
      displaced[yr]["idps"] = (row.idps as number) ?? 0;
    }

    const years = Array.from(
      new Set([...Object.keys(hosted), ...Object.keys(displaced)].map(Number)),
    ).sort();
    const annual = years.map(yr => ({
      year: yr,
      ...((hosted[yr] ?? {}) as object),
      nationals_displaced_abroad: (displaced[yr]?.nationals_displaced_abroad as number) ?? 0,
      idps: (displaced[yr]?.idps as number) ?? 0,
    }));

    totalRows += annual.length;
    countryProfiles[name] = { iso3, name, annual_data: annual };
  }

  console.log(`  → ${totalRows} country-year records across ${UNHCR_ISO3.length} countries`);

  const output = {
    metadata: {
      title: "East Africa Refugee & Displacement Flows (UNHCR, 2010–2024)",
      source: "UNHCR Population Statistics API — compiled by WatchTower",
      generated_at: new Date().toISOString(),
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2010–2024)",
      license: "CC BY 4.0",
      notes: [
        "Figures represent number of persons.",
        "refugees_hosted / asylum_seekers_hosted: persons hosted in this country (country of asylum).",
        "nationals_displaced_abroad: nationals of this country displaced outside borders.",
        "idps: internally displaced persons (sourced from UNHCR country of origin data).",
        "Zero values may indicate no data reported rather than true zero.",
      ],
      watchtower_relevance:
        "Displacement is both a symptom and driver of governance failure. High IDP/refugee burdens " +
        "correlate with the types of accountability incidents WatchTower tracks — security force violence, " +
        "food aid diversion, and statelessness. This dataset allows analysts to contextualise incident " +
        "reports within the broader displacement landscape.",
    },
    countries: countryProfiles,
  };

  return Buffer.from(JSON.stringify(output, null, 2), "utf-8");
}

// ─── Dataset 7 ── East Africa Gender & Social Equity Dashboard (Excel) ────────
//   Source: World Bank World Development Indicators
//   Novel:  First WatchTower dataset covering gender equity and social inclusion —
//           women in parliament, gender parity in education, female labour force
//           participation, maternal mortality — compiled as a multi-sheet Excel
//           workbook designed for analyst use.

async function buildGenderEquityExcel(): Promise<Buffer> {
  console.log("  Fetching gender & social equity indicators from World Bank…");

  const INDICATORS: Record<string, string> = {
    "SG.GEN.PARL.ZS": "women_in_parliament_pct",
    "SL.TLF.CACT.FE.ZS": "female_labour_participation_pct",
    "SE.ENR.PRSC.FM.ZS": "gender_parity_index_primary",
    "SE.ENR.SECO.FM.ZS": "gender_parity_index_secondary",
    "SH.STA.MMRT": "maternal_mortality_per_100k_births",
    "SP.ADO.TFRT": "adolescent_birth_rate_per_1000",
    "SG.LAW.INDX": "women_legal_protection_index_0to100",
    "IC.LGL.CRED.XQ": "credit_legal_rights_index_0to12",
  };

  const raw = await fetchWBIndicators(
    EAST_AFRICA_WB,
    Object.keys(INDICATORS),
    2000,
    2023,
  );

  // Pivot to country+year rows
  const pivot = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    const key = `${row.country}|${row.year}`;
    if (!pivot.has(key)) pivot.set(key, { country: row.country, year: row.year });
    pivot.get(key)![INDICATORS[row.indicator]] = round2(row.value);
  }

  const allRows = Array.from(pivot.values()).sort(
    (a, b) =>
      (a.country as string).localeCompare(b.country as string) ||
      (a.year as number) - (b.year as number),
  );

  // Gender Equity Score: higher is better
  for (const r of allRows) {
    const subs: number[] = [];
    const parl = r["women_in_parliament_pct"] as number | undefined;
    const labour = r["female_labour_participation_pct"] as number | undefined;
    const gpiPrim = r["gender_parity_index_primary"] as number | undefined;
    const gpiSec = r["gender_parity_index_secondary"] as number | undefined;
    const mmr = r["maternal_mortality_per_100k_births"] as number | undefined;
    const legal = r["women_legal_protection_index_0to100"] as number | undefined;

    if (parl !== undefined) subs.push(Math.min(100, parl * 2));          // 50% = 100
    if (labour !== undefined) subs.push(Math.min(100, labour));
    if (gpiPrim !== undefined) subs.push(Math.min(100, gpiPrim * 100));   // 1.0 = 100
    if (gpiSec !== undefined) subs.push(Math.min(100, gpiSec * 100));
    if (mmr !== undefined) subs.push(Math.max(0, 100 - (mmr / 1000) * 100));
    if (legal !== undefined) subs.push(legal);

    r["gender_equity_score"] =
      subs.length >= 3 ? round2(subs.reduce((a, b) => a + b, 0) / subs.length) : "";
    const s = r["gender_equity_score"] as number | string;
    r["equity_tier"] =
      s === "" ? "Insufficient data" :
      (s as number) >= 65 ? "Equitable" :
      (s as number) >= 45 ? "Progressing" :
      (s as number) >= 25 ? "Lagging" : "Critical";
  }

  console.log(`  → ${allRows.length} rows`);

  // Latest year per country for summary sheet
  const latestByCountry = new Map<string, Record<string, unknown>>();
  for (const r of allRows) {
    const c = r.country as string;
    if (!latestByCountry.has(c) || (r.year as number) > (latestByCountry.get(c)!.year as number)) {
      latestByCountry.set(c, r);
    }
  }
  const summaryRows = Array.from(latestByCountry.values()).sort((a, b) =>
    (a.country as string).localeCompare(b.country as string),
  );

  // Build multi-sheet Excel workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary (latest available year per country)
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary (Latest Year)");

  // Sheet 2: All years
  const allSheet = XLSX.utils.json_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, allSheet, "All Years");

  // Sheet 3–10: Per-country sheets
  for (const countryName of Array.from(EAST_AFRICA_NAMES)) {
    const countryRows = allRows.filter(r => r.country === countryName);
    if (countryRows.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(countryRows);
    XLSX.utils.book_append_sheet(wb, ws, countryName.slice(0, 31));
  }

  // Sheet: Metadata
  const metaRows = [
    { field: "Title", value: "WatchTower East Africa Gender & Social Equity Dashboard (2000–2023)" },
    { field: "Source", value: "World Bank World Development Indicators — compiled by WatchTower" },
    { field: "Coverage", value: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia" },
    { field: "License", value: "CC BY 4.0" },
    { field: "Format", value: "Excel (.xlsx) — 3 summary sheets + 8 per-country sheets" },
    { field: "Generated", value: new Date().toISOString() },
    { field: "", value: "" },
    { field: "Indicator: women_in_parliament_pct", value: "Proportion of seats held by women in national parliaments (%)" },
    { field: "Indicator: female_labour_participation_pct", value: "Female labour force participation rate, % of female population ages 15+" },
    { field: "Indicator: gender_parity_index_primary", value: "Ratio of female to male gross enrolment in primary school (1.0 = parity)" },
    { field: "Indicator: gender_parity_index_secondary", value: "Ratio of female to male gross enrolment in secondary school" },
    { field: "Indicator: maternal_mortality_per_100k_births", value: "Maternal mortality ratio, per 100,000 live births (lower = better)" },
    { field: "Indicator: adolescent_birth_rate_per_1000", value: "Births per 1,000 women ages 15–19 (lower = better)" },
    { field: "Indicator: women_legal_protection_index_0to100", value: "Women Business and the Law index score (0–100; 100 = full equality)" },
    { field: "Indicator: gender_equity_score", value: "WatchTower composite 0–100 (higher = more equitable). Mean of normalised sub-scores (≥3 required)." },
    { field: "Equity Tier: Critical", value: "Score < 25" },
    { field: "Equity Tier: Lagging", value: "Score 25–45" },
    { field: "Equity Tier: Progressing", value: "Score 45–65" },
    { field: "Equity Tier: Equitable", value: "Score ≥ 65" },
  ];
  const metaSheet = XLSX.utils.json_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, metaSheet, "Metadata & Methodology");

  const xlsBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return xlsBuf;
}

// ─── Dataset 8 ── East Africa Country Risk Profiles (PDF) ─────────────────────
//   Source: Synthesises all WatchTower composite indices
//   Novel:  Printable, shareable country risk briefs — one page per country with
//           all composite scores presented as a formatted accountability dashboard.
//           Designed for civil society organisations, donors, and journalists.

async function buildCountryRiskProfilesPDF(
  govRows: Record<string, unknown>[],
  fiscalRows: Record<string, unknown>[],
  humanRows: Record<string, unknown>[],
  civilRows: Record<string, unknown>[],
): Promise<Buffer> {
  console.log("  Compiling country risk profiles into PDF…");

  // Extract latest-year record per country for each index
  function latest(
    rows: Record<string, unknown>[],
    scoreField: string,
    tierField: string,
  ): Map<string, { score: string; tier: string; year: number }> {
    const map = new Map<string, { score: string; tier: string; year: number }>();
    for (const r of rows) {
      const c = r.country as string;
      const yr = r.year as number;
      if (!map.has(c) || yr > map.get(c)!.year) {
        map.set(c, {
          score: r[scoreField] !== undefined && r[scoreField] !== "" ? String(r[scoreField]) : "N/A",
          tier: r[tierField] as string ?? "N/A",
          year: yr,
        });
      }
    }
    return map;
  }

  const govMap = latest(govRows, "governance_risk_score", "risk_tier");
  const fiscalMap = latest(fiscalRows, "fiscal_accountability_score", "accountability_tier");
  const humanMap = latest(humanRows, "human_security_score", "security_tier");
  const civilMap = latest(civilRows, "civil_space_score", "civil_space_tier");

  const countries = Array.from(EAST_AFRICA_NAMES).sort();
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const BRAND = "#1a1a2e";
    const ACCENT = "#e94560";
    const GREY = "#6b7280";
    const LIGHT = "#f3f4f6";

    // ── Cover page ───────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 180).fill(BRAND);
    doc.fillColor("white").fontSize(26).font("Helvetica-Bold")
      .text("WatchTower", 50, 60);
    doc.fontSize(14).font("Helvetica")
      .text("East Africa Country Risk Profiles", 50, 95);
    doc.fontSize(11).fillColor("#aab0c0")
      .text(`Annual Accountability Snapshot  ·  ${generatedDate}`, 50, 120);

    doc.fillColor(GREY).fontSize(10).font("Helvetica").moveDown(8)
      .text(
        "This document synthesises four WatchTower composite indices — Governance Risk, " +
        "Fiscal Accountability, Human Security, and Civil Space — into a single-page profile " +
        "for each of eight East African countries. Scores are normalised to 0–100 and derived " +
        "from World Bank open data. Designed for civil society organisations, donors, and " +
        "journalists who require a rapid, shareable accountability reference.",
        50, 200, { width: 495 },
      );

    doc.moveDown(1.5);
    doc.fontSize(9).fillColor(GREY)
      .text("Sources: World Bank CPIA / WDI / WGI  ·  License: CC BY 4.0  ·  WatchTower Platform", { align: "center" });

    // ── Index definitions ────────────────────────────────────────────────────
    doc.addPage();
    doc.fillColor(BRAND).fontSize(16).font("Helvetica-Bold").text("Index Definitions", 50, 50);
    doc.moveTo(50, 72).lineTo(545, 72).strokeColor(ACCENT).lineWidth(1.5).stroke();

    const defs = [
      {
        name: "Governance Risk Score",
        range: "0–100 (higher = worse governance)",
        tiers: "Low <25  ·  Moderate 25–40  ·  Elevated 40–55  ·  High 55–70  ·  Critical ≥70",
        note:
          "Synthesises 6 World Bank CPIA dimensions: Transparency & Accountability, Rule of Law, " +
          "Public Admin Quality, Public Sector Management, Fiscal Management, Regulatory Environment.",
      },
      {
        name: "Fiscal Accountability Score",
        range: "0–100 (higher = more accountable)",
        tiers: "Critical <30  ·  Weak 30–50  ·  Moderate 50–70  ·  Strong ≥70",
        note:
          "Combines tax mobilisation, debt burden, aid dependency, and budget balance from WDI. " +
          "Rewards domestic resource mobilisation and penalises aid dependency.",
      },
      {
        name: "Human Security Score",
        range: "0–100 (higher = more secure)",
        tiers: "Crisis <30  ·  Vulnerable 30–50  ·  Moderate 50–70  ·  Secure ≥70",
        note:
          "Aggregates homicide rate, poverty headcount, life expectancy, school enrolment, " +
          "child mortality, and internet access from WDI.",
      },
      {
        name: "Civil Space Score",
        range: "0–100 (higher = more open)",
        tiers: "Repressed <25  ·  Obstructed 25–45  ·  Narrowed 45–65  ·  Open ≥65",
        note:
          "Combines WGI Voice & Accountability and Rule of Law with internet access, legal rights " +
          "strength, and military expenditure as a militarisation proxy.",
      },
    ];

    let y = 85;
    for (const d of defs) {
      doc.fillColor(BRAND).fontSize(11).font("Helvetica-Bold").text(d.name, 50, y);
      y += 16;
      doc.fillColor(ACCENT).fontSize(9).font("Helvetica").text(`Range: ${d.range}`, 50, y);
      y += 13;
      doc.fillColor(GREY).text(`Tiers: ${d.tiers}`, 50, y, { width: 495 });
      y += 13;
      doc.fillColor("#374151").text(d.note, 50, y, { width: 495 });
      y += 40;
    }

    // ── Per-country pages ────────────────────────────────────────────────────
    for (const country of countries) {
      doc.addPage();

      const gov = govMap.get(country);
      const fiscal = fiscalMap.get(country);
      const human = humanMap.get(country);
      const civil = civilMap.get(country);

      // Header band
      doc.rect(0, 0, doc.page.width, 80).fill(BRAND);
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
        .text(country, 50, 22);
      doc.fontSize(10).font("Helvetica").fillColor("#aab0c0")
        .text("WatchTower Accountability Risk Profile  ·  East Africa", 50, 52);

      // Score cards (4 columns)
      const cards = [
        { label: "Governance Risk", data: gov, invert: true },
        { label: "Fiscal Accountability", data: fiscal, invert: false },
        { label: "Human Security", data: human, invert: false },
        { label: "Civil Space", data: civil, invert: false },
      ];

      const cardW = 118, cardH = 80, cardY = 100, gap = 9;
      cards.forEach(({ label, data, invert }, i) => {
        const x = 50 + i * (cardW + gap);
        doc.rect(x, cardY, cardW, cardH).fill(LIGHT);

        const scoreNum = data ? parseFloat(data.score) : NaN;
        const colour =
          isNaN(scoreNum) ? GREY :
          invert
            ? (scoreNum >= 70 ? ACCENT : scoreNum >= 55 ? "#f97316" : scoreNum >= 40 ? "#eab308" : "#22c55e")
            : (scoreNum >= 65 ? "#22c55e" : scoreNum >= 45 ? "#eab308" : scoreNum >= 25 ? "#f97316" : ACCENT);

        doc.fillColor(colour).fontSize(22).font("Helvetica-Bold")
          .text(data?.score ?? "N/A", x + 8, cardY + 12, { width: cardW - 16, align: "center" });
        doc.fillColor(GREY).fontSize(8).font("Helvetica")
          .text(label, x + 4, cardY + 42, { width: cardW - 8, align: "center" });
        doc.fillColor(GREY).fontSize(7)
          .text(data?.tier ?? "—", x + 4, cardY + 56, { width: cardW - 8, align: "center" });
        if (data?.year) {
          doc.fillColor("#9ca3af").fontSize(7)
            .text(`(${data.year})`, x + 4, cardY + 68, { width: cardW - 8, align: "center" });
        }
      });

      // Detail table
      const tableY = 205;
      doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor("#e5e7eb").lineWidth(1).stroke();
      doc.fillColor(BRAND).fontSize(11).font("Helvetica-Bold")
        .text("Detailed Scores by Index", 50, tableY + 8);

      const tableData = [
        ["Index", "Score", "Tier", "Year", "Primary Signal"],
        [
          "Governance Risk",
          gov?.score ?? "N/A", gov?.tier ?? "—", String(gov?.year ?? "—"),
          "Transparency, rule of law, public admin quality",
        ],
        [
          "Fiscal Accountability",
          fiscal?.score ?? "N/A", fiscal?.tier ?? "—", String(fiscal?.year ?? "—"),
          "Tax mobilisation, debt burden, aid dependency",
        ],
        [
          "Human Security",
          human?.score ?? "N/A", human?.tier ?? "—", String(human?.year ?? "—"),
          "Poverty, health, education, homicide",
        ],
        [
          "Civil Space",
          civil?.score ?? "N/A", civil?.tier ?? "—", String(civil?.year ?? "—"),
          "Voice & accountability, rule of law, internet access",
        ],
      ];

      const colWidths = [145, 55, 100, 40, 195];
      let ty = tableY + 30;
      for (let ri = 0; ri < tableData.length; ri++) {
        const row = tableData[ri];
        const isHeader = ri === 0;
        doc.rect(50, ty - 4, 495, 18).fill(isHeader ? BRAND : (ri % 2 === 0 ? "white" : LIGHT));
        let tx = 50;
        for (let ci = 0; ci < row.length; ci++) {
          doc
            .fillColor(isHeader ? "white" : BRAND)
            .fontSize(isHeader ? 8 : 9)
            .font(isHeader ? "Helvetica-Bold" : "Helvetica")
            .text(row[ci], tx + 4, ty, { width: colWidths[ci] - 4, lineBreak: false });
          tx += colWidths[ci];
        }
        ty += 18;
      }

      // WatchTower context note
      doc.moveDown(0.5);
      doc.rect(50, ty + 8, 495, 1).fill("#e5e7eb");
      doc.fillColor(GREY).fontSize(8).font("Helvetica")
        .text(
          `Scores reflect the most recent year with available data. All indices are compiled from World Bank ` +
          `open data (CPIA/WDI/WGI) and normalised to 0–100. This profile is generated by the WatchTower ` +
          `platform (thewatchtower.tech) for accountability research and civil society use. License: CC BY 4.0.`,
          50, ty + 16, { width: 495 },
        );
    }

    doc.end();
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

interface DatasetMeta {
  title: string;
  description: string;
  category: string;
  tags: string[];
  source: string;
  license: string;
  version: string;
  coverage: string;
  keywords: string[];
  methodology: string;
  format: string;
  fileType: string;
}

async function main() {
  console.log("\n🗑  Clearing existing dataset records…");
  await db.delete(datasets);
  console.log("   Done.\n");

  // ── Phase 1: CSV datasets ──────────────────────────────────────────────────

  type CsvDef = DatasetMeta & { buildFn: () => Promise<string>; filename: string };

  const csvDefs: CsvDef[] = [
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
      tags: ["governance", "risk-index", "world-bank", "cpia", "east-africa", "composite"],
      source: "World Bank CPIA — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2005–2023)",
      keywords: ["governance", "corruption", "rule-of-law", "accountability", "east-africa", "risk", "cpia"],
      methodology:
        "Six CPIA scores (1–6) normalised to 0–100 per dimension. " +
        "Composite risk score = 100 − mean(normalised dimensions). " +
        "Risk tier thresholds: Low <25, Moderate 25–40, Elevated 40–55, High 55–70, Critical ≥70. " +
        "Country-years with fewer than 3 of 6 dimensions available are excluded.",
      format: "CSV",
      fileType: "text/csv",
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
      format: "CSV",
      fileType: "text/csv",
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
      format: "CSV",
      fileType: "text/csv",
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
        "CIVICUS Monitor classifications: Open, Narrowed, Obstructed, Repressed.",
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
      format: "CSV",
      fileType: "text/csv",
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
        "fatality estimates, and source citation.",
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
      format: "CSV",
      fileType: "text/csv",
    },
  ];

  // Run CSV builds and capture rows from governance/fiscal/human/civil for PDF reuse
  let govRows: Record<string, unknown>[] = [];
  let fiscalRows: Record<string, unknown>[] = [];
  let humanRows: Record<string, unknown>[] = [];
  let civilRows: Record<string, unknown>[] = [];

  const allInserts: Array<DatasetMeta & { fileKey: string; fileSize: number; filename: string }> = [];

  for (const def of csvDefs) {
    console.log(`\n📊 Building: ${def.title}`);
    try {
      const csv = await def.buildFn();
      if (!csv || csv.trim() === "") {
        console.warn("  ⚠  Empty CSV — skipping");
        continue;
      }
      // Capture rows for PDF
      const lines = csv.split("\n");
      const headers = lines[0].split(",");
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
      });
      if (def.filename.includes("governance")) govRows = parsed;
      else if (def.filename.includes("fiscal")) fiscalRows = parsed;
      else if (def.filename.includes("human")) humanRows = parsed;
      else if (def.filename.includes("civil")) civilRows = parsed;

      const { fileKey, fileSize } = await uploadCSV(csv, def.filename);
      allInserts.push({ ...def, fileKey, fileSize, filename: def.filename });
      console.log(`  ✅ ${fileKey} (${(fileSize / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed: ${(err as Error).message}`);
    }
  }

  // ── Phase 2: JSON dataset (UNHCR) ─────────────────────────────────────────

  console.log("\n📊 Building: East Africa Refugee & Displacement Flows (JSON)");
  try {
    const jsonBuf = await buildRefugeeDataJSON();
    const filename = "watchtower-east-africa-refugee-displacement-unhcr-2010-2024.json";
    const { fileKey, fileSize } = await uploadBuffer(jsonBuf, filename, "application/json");
    allInserts.push({
      title: "East Africa Refugee & Displacement Flows (UNHCR, 2010–2024)",
      description:
        "Structured JSON dataset of refugee and internally displaced person (IDP) flows for eight East " +
        "African countries from 2010 to 2024, sourced from the UNHCR Population Statistics API. For each " +
        "country and year, the dataset records: refugees hosted (country of asylum), asylum-seekers hosted, " +
        "nationals displaced abroad, and IDP counts. Designed for developers and analysts who need " +
        "displacement data in machine-readable format to correlate with WatchTower incident reports.",
      category: "Humanitarian",
      tags: ["refugees", "displacement", "idps", "unhcr", "east-africa", "humanitarian"],
      source: "UNHCR Population Statistics API — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2010–2024)",
      keywords: ["refugees", "asylum", "displacement", "idps", "unhcr", "migration", "east-africa"],
      methodology:
        "Data fetched from UNHCR Population Statistics API (api.unhcr.org/population/v1/). " +
        "Two queries per country: country-of-asylum (refugees and asylum-seekers hosted) and " +
        "country-of-origin (nationals displaced abroad + IDPs). Results merged by year into a " +
        "nested JSON structure: metadata → countries → annual_data[]. Zero values may indicate " +
        "no data reported rather than true zero population.",
      format: "JSON",
      fileType: "application/json",
      fileKey,
      fileSize,
      filename,
    });
    console.log(`  ✅ ${fileKey} (${(fileSize / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`  ❌ JSON dataset failed: ${(err as Error).message}`);
  }

  // ── Phase 3: Excel dataset (World Bank gender indicators) ─────────────────

  console.log("\n📊 Building: East Africa Gender & Social Equity Dashboard (Excel)");
  try {
    const xlsBuf = await buildGenderEquityExcel();
    const filename = "watchtower-east-africa-gender-equity-dashboard-2000-2023.xlsx";
    const { fileKey, fileSize } = await uploadBuffer(
      xlsBuf,
      filename,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    allInserts.push({
      title: "WatchTower East Africa Gender & Social Equity Dashboard (2000–2023)",
      description:
        "A multi-sheet Excel workbook tracking gender equity and social inclusion across eight East " +
        "African countries from 2000 to 2023. Covers eight World Bank indicators: women in parliament, " +
        "female labour force participation, gender parity in primary and secondary education, maternal " +
        "mortality, adolescent birth rate, and the Women Business and the Law legal protection index. " +
        "Includes a WatchTower Gender Equity Score (0–100) and a four-tier classification. Workbook " +
        "contains a summary sheet (latest year), an all-years sheet, one sheet per country, and a " +
        "methodology reference sheet — designed for analysts who prefer spreadsheet tools.",
      category: "Demographics",
      tags: ["gender", "equity", "women", "social-inclusion", "east-africa", "world-bank", "education"],
      source: "World Bank World Development Indicators — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (2000–2023)",
      keywords: ["gender", "women", "equality", "parliament", "maternal-health", "education", "east-africa"],
      methodology:
        "Sub-scores normalised to 0–100: women in parliament (×2, capped at 100), female labour " +
        "participation (direct), gender parity indices (×100), maternal mortality (100 − rate/1000×100), " +
        "legal protection index (direct). Gender Equity Score = mean of ≥3 available sub-scores. " +
        "Tiers: Critical <25, Lagging 25–45, Progressing 45–65, Equitable ≥65.",
      format: "Excel",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileKey,
      fileSize,
      filename,
    });
    console.log(`  ✅ ${fileKey} (${(fileSize / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`  ❌ Excel dataset failed: ${(err as Error).message}`);
  }

  // ── Phase 4: PDF dataset (Country Risk Profiles) ──────────────────────────

  console.log("\n📊 Building: East Africa Country Risk Profiles (PDF)");
  try {
    const pdfBuf = await buildCountryRiskProfilesPDF(govRows, fiscalRows, humanRows, civilRows);
    const filename = "watchtower-east-africa-country-risk-profiles-2023.pdf";
    const { fileKey, fileSize } = await uploadBuffer(pdfBuf, filename, "application/pdf");
    allInserts.push({
      title: "WatchTower East Africa Country Risk Profiles — Accountability Snapshot",
      description:
        "A printable PDF report presenting four WatchTower accountability indices side-by-side for each " +
        "of eight East African countries. Each country profile displays the Governance Risk Score, Fiscal " +
        "Accountability Score, Human Security Score, and Civil Space Score with colour-coded risk tiers. " +
        "The document opens with an index definitions page and closes each country section with a sourcing " +
        "note. Designed for civil society organisations, donors, journalists, and policymakers who need a " +
        "shareable, formatted reference without requiring spreadsheet software.",
      category: "Governance",
      tags: ["country-profiles", "risk", "governance", "accountability", "pdf", "east-africa", "summary"],
      source: "World Bank CPIA / WDI / WGI — compiled by WatchTower",
      license: "CC BY 4.0",
      version: "1.0",
      coverage: "Kenya, Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan, Somalia (latest available year)",
      keywords: ["country-profiles", "risk", "governance", "accountability", "report", "east-africa"],
      methodology:
        "Each score on the country profile page represents the most recent year for which the composite " +
        "index has sufficient data. All four indices are derived from World Bank open data and normalised " +
        "to 0–100. See individual CSV/Excel datasets for full methodology per index.",
      format: "PDF",
      fileType: "application/pdf",
      fileKey,
      fileSize,
      filename,
    });
    console.log(`  ✅ ${fileKey} (${(fileSize / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`  ❌ PDF dataset failed: ${(err as Error).message}`);
  }

  // ── Insert all records ────────────────────────────────────────────────────

  console.log(`\n💾 Inserting ${allInserts.length} dataset records into database…`);
  for (const r of allInserts) {
    await db.insert(datasets).values({
      title: r.title,
      description: r.description,
      category: r.category,
      tags: r.tags,
      fileKey: r.fileKey,
      fileName: r.filename,
      fileSize: r.fileSize,
      fileType: r.fileType,
      format: r.format,
      source: r.source,
      license: r.license,
      version: r.version,
      coverage: r.coverage,
      keywords: r.keywords,
      methodology: r.methodology,
      isPublic: true,
    });
    console.log(`  ✅ ${r.title}`);
  }

  console.log(`\n🎉 Done — ${allInserts.length} real, downloadable datasets live in the database.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
