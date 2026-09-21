import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = join(root, 'messages');

const SECTIONS = [
  'Common', 'Navigation', 'Footer', 'LogoCloud', 'AnnouncementBanner',
  'Home', 'HomeLivePreview', 'About', 'Alerts', 'AnonymousReporting',
  'CaseStudiesPage', 'CodeOfConduct', 'Security', 'PrivacyPolicyPage',
  'Datasets', 'Insights', 'MapsPage', 'Organizations', 'Reports', 'ChatPage'
];

const IGNORED_KEYS = new Set(['appName', 'watchtower']);
const IGNORED_KEY_RE = /^(lang|region)[A-Z]/;

// Values that are genuinely identical to English in a given language
// (loanwords or identical French words). Be explicit here — do not add
// broad value filters that would hide real gaps in other languages.
const IGNORED_VALUES = {
  lg: new Set(['Alerts.emailLabel']),
  luo: new Set(['Alerts.emailLabel']),
  om: new Set(['Alerts.emailLabel']),
  suk: new Set(['Alerts.emailLabel']),
  fr: new Set([
    'Navigation.chat', 'Footer.cookies', 'Footer.contact',
    'HomeLivePreview.viewAsGlobe', 'CaseStudiesPage.pageLabel',
    'Insights.page', 'Reports.page', 'CodeOfConduct.correctionTitle',
    'CodeOfConduct.attributionTitle'
  ])
};

const files = readdirSync(messagesDir).filter((f) => f.endsWith('.json')).sort();
const enFile = files.find((f) => f === 'en.json');
if (!enFile) {
  console.error('i18n-check: missing messages/en.json');
  process.exit(1);
}

const en = JSON.parse(readFileSync(join(messagesDir, enFile), 'utf8'));
const violations = [];
let checked = 0;

for (const file of files) {
  if (file === enFile) continue;
  const lang = file.replace(/\.json$/, '');
  const data = JSON.parse(readFileSync(join(messagesDir, file), 'utf8'));
  const langIgnores = IGNORED_VALUES[lang];
  for (const section of SECTIONS) {
    if (typeof data[section] !== 'object' || typeof en[section] !== 'object') {
      violations.push(`${lang}: missing section "${section}"`);
      continue;
    }
    for (const [key, value] of Object.entries(en[section])) {
      const local = data[section][key];
      if (typeof local === 'string' && typeof value === 'string') {
        checked++;
        if (
          local === value &&
          String(value).trim().length > 2 &&
          !IGNORED_KEYS.has(key) &&
          !IGNORED_KEY_RE.test(key) &&
          !(langIgnores && langIgnores.has(`${section}.${key}`))
        ) {
          violations.push(`${lang}: ${section}.${key} is still English ("${value}")`);
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`i18n-check: ${violations.length} value(s) not translated across ${checked} checked strings.`);
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log(`i18n-check: OK — ${files.length - 1} languages, ${checked} marketing strings checked.`);