// Seed documents for the site's pages: Home, About, and the header and text of
// the Security, Code of Conduct and Privacy Policy pages. Their text, in all
// 13 languages, is in seed/pages/<lang>.json, keyed as it was in the
// frontend's messages/*.json before it moved to Sanity ("Home.heroTitleLine1").
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES } from "../../src/sanity/languages";

type Strings = Record<string, string>;
type Language = string;

export const loadPageStrings = (dir: string): Record<Language, Strings> =>
  Object.fromEntries(LANGUAGES.map(({ id }) => [id, JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8"))]));

// Messages marked line breaks in headings as <break></break>; in Sanity they
// are plain newlines in a text field.
const withBreaks = (value: string) => value.replace(/<break><\/break>/g, "\n");

export const pageBuilders = (pages: Record<Language, Strings>) => {
  // One internationalized-array value per language that has the key.
  const localized = <T>(valueType: string, key: string, build: (text: string, language: Language) => T) =>
    LANGUAGES.flatMap(({ id }) => {
  const text = pages[id]?.[key];
  return text === undefined
    ? []
    : [{ _key: id, _type: `internationalizedArray${valueType}Value`, language: id, value: build(text, id) }];
});
  const string = (key: string) => localized("String", key, (text) => text);
  const text = (key: string) => localized("Text", key, withBreaks);

  // ── Portable Text for the policy pages ────────────────────────────────────
  // Paragraphs may hold rich tags from the messages: <strong> and named links
  // whose addresses were in the page code.
  type Block = Record<string, unknown>;
  type Piece =
| { p: string }
| { strong: string }
| { h3: string }
| { list: string[] }
| { emails: string[] }
| { labelled: [string, string] };

  // Every language gets the whole body; a missing string is an error, since
  // all 13 languages had every policy string.
  const policyBody = (pieces: Piece[], links: Record<string, string> = {}) =>
    LANGUAGES.flatMap(({ id }) => {
      const t = (key: string) => {
        const value = pages[id]?.[key];
        if (value === undefined) throw new Error(`seed/pages/${id}.json has no ${key}`);
        return value;
      };
      let n = 0;
      const key = () => `k${(n++).toString(36).padStart(4, "0")}`;

      const spans = (value: string, marks: string[] = []) => {
        const markDefs: Block[] = [];
        const children: Block[] = [];
        let rest = value;
        const tag = /<(\w+)>(.*?)<\/\1>/;
        for (let match = tag.exec(rest); match; match = tag.exec(rest)) {
          if (match.index > 0) children.push({ _key: key(), _type: "span", marks, text: rest.slice(0, match.index) });
          const [whole, name, inner] = match;
          if (name === "strong") {
            children.push({ _key: key(), _type: "span", marks: [...marks, "strong"], text: inner });
          } else {
            const href = links[name];
            if (!href) throw new Error(`No link address for <${name}> in seed/pages/${id}.json`);
            const markKey = key();
            markDefs.push({ _key: markKey, _type: "link", href });
            children.push({ _key: key(), _type: "span", marks: [...marks, markKey], text: inner });
          }
          rest = rest.slice(match.index + whole.length);
        }
        if (rest) children.push({ _key: key(), _type: "span", marks, text: rest });
        return { markDefs, children };
      };
      const block = (value: string, extra: Block = {}, marks: string[] = []) => ({
        _key: key(),
        _type: "block",
        style: "normal",
        ...extra,
        ...spans(value, marks),
      });

      const value = pieces.flatMap((piece): Block[] => {
        if ("p" in piece) return [block(t(piece.p))];
        if ("strong" in piece) return [block(t(piece.strong), {}, ["strong"])];
        if ("h3" in piece) return [block(t(piece.h3), { style: "h3" })];
        if ("list" in piece) return piece.list.map((k) => block(t(k), { listItem: "bullet", level: 1 }));
        if ("emails" in piece)
          return piece.emails.map((email) => {
            const markKey = key();
            return {
              _key: key(),
              _type: "block",
              style: "normal",
              listItem: "bullet",
              level: 1,
              markDefs: [{ _key: markKey, _type: "link", href: `mailto:${email}` }],
              children: [{ _key: key(), _type: "span", marks: [markKey], text: email }],
            };
          });
        const [label, textKey] = piece.labelled;
        const labelled = spans(t(textKey));
        return [
          {
            _key: key(),
            _type: "block",
            style: "normal",
            markDefs: labelled.markDefs,
            children: [{ _key: key(), _type: "span", marks: ["strong"], text: t(label) }, { _key: key(), _type: "span", marks: [], text: " " }, ...labelled.children],
          },
        ];
      });
      return [{ _key: id, _type: "internationalizedArrayPolicyBodyValue", language: id, value }];
    });

  const section = (anchor: string, titleKey: string | null, body: ReturnType<typeof policyBody>) => ({
    _key: anchor,
    _type: "policySection",
    anchor: { _type: "slug", current: anchor },
    ...(titleKey ? { title: string(titleKey) } : {}),
    body,
  });

  const item = <T extends Record<string, unknown>>(type: string, index: number, fields: T) => ({
    _key: `${type}${index + 1}`,
    _type: type,
    ...fields,
  });

  return { string, text, policyBody, section, item };
};

const REPORT_EMAILS = ["noble@amplifiedaccess.org", "aziz@amplifiedaccess.org"];

export const buildPageDocs = (pages: Record<Language, Strings>) => {
  const { string, text, policyBody, section, item } = pageBuilders(pages);

  const home = {
    _id: "homePage",
    _type: "homePage",
    hero: {
      titleLine1: string("Home.heroTitleLine1"),
      titleLine2: string("Home.heroTitleLine2"),
      description: text("Home.heroDescription"),
      primaryCta: string("Home.reportIncident"),
      secondaryCta: string("Home.viewMaps"),
    },
    explore: { heading: string("Home.exploreLabel"), description: text("Home.exploreDescription") },
    // The figures were hard-coded next to their translated labels.
    stats: [
      ["2,000+", "Home.statWeeklyUsers"],
      ["22", "Home.statDeployments"],
      ["13", "Home.statLanguages"],
      ["6", "Home.statCountries"],
    ].map(([value, label], i) => item("figure", i, { value, label: string(label) })),
    howItWorks: {
      heading: string("Home.howItWorks"),
      description: text("Home.howItWorksDescription"),
      steps: [1, 2, 3].map((n, i) =>
        item("step", i, { title: string(`Home.step${n}Title`), description: text(`Home.step${n}Description`) }),
      ),
    },
    speakNaturally: {
      title: text("Home.speakNaturallyTitle"),
      description: text("Home.speakNaturallyDescription"),
      cta: string("Home.speakNaturallyCta"),
    },
    insights: {
      label: string("Home.insightsLabel"),
      heading: string("Home.insightsHeading"),
      description: text("Home.insightsDescription"),
      cta: string("Home.insightsCta"),
      readStory: string("Home.readStory"),
      sampleTitles: [1, 2, 3].map((n, i) => item("sampleStory", i, { title: string(`Home.insightsFallback${n}Title`) })),
    },
    faqs: {
      label: string("Home.faqsLabel"),
      heading: string("Home.faqsHeading"),
      description: text("Home.faqsDescription"),
      items: [1, 2, 3, 4, 5].map((n, i) =>
        item("faqItem", i, { question: string(`Home.faq${n}Question`), answer: text(`Home.faq${n}Answer`) }),
      ),
    },
    impact: { title: string("Home.impactTitle"), description: text("Home.impactDescription") },
    banner: { text: string("Home.ctaTitle"), cta: string("Home.ctaButton1") },
  };

  const about = {
    _id: "aboutPage",
    _type: "aboutPage",
    hero: { title: string("About.heroTitle") },
    steps: [1, 2, 3].map((n, i) =>
      item("aboutStep", i, {
        title: text(`About.step${n}Title`),
        description: text(`About.step${n}Description`),
      }),
    ),
    languages: {
      heading: string("About.languagesTitle"),
      description: text("About.languagesDescription"),
    },
    audiences: {
      heading: text("About.audiencesHeading"),
      items: ["Communities", "Organisations", "Evidence"].map((who, i) =>
        item("audience", i, {
          label: string(`About.audience${who}Label`),
          title: string(`About.audience${who}Title`),
          description: text(`About.audience${who}Description`),
        }),
      ),
    },
    safety: {
      title: text("About.safetyTitle"),
      description: text("About.safetyDescription"),
      items: ["Identity", "Account", "Encryption", "Visibility", "Device"].map((topic, i) =>
        item("faqItem", i, { question: string(`About.faq${topic}Question`), answer: text(`About.faq${topic}Answer`) }),
      ),
    },
    cta: {
      title: string("About.ctaTitle"),
      description: text("About.ctaDescription"),
      primaryCta: string("About.ctaButton1"),
      secondaryCta: string("About.ctaButton2"),
    },
  };

  const policyHero = (ns: string) => ({
    eyebrow: string(`${ns}.badge`),
    title: string(`${ns}.heroTitle`),
    description: text(`${ns}.heroDescription`),
  });
  const policySeo = (ns: string) => ({ title: string(`${ns}.metaTitle`), description: text(`${ns}.metaDescription`) });

  const security = {
    _id: "security",
    _type: "legalPage",
    name: "Security",
    hero: policyHero("Security"),
    seo: policySeo("Security"),
    sections: [
      section("introduction", null, policyBody([{ p: "Security.intro" }])),
      section(
        "reporting",
        "Security.reportingTitle",
        policyBody([
          { strong: "Security.reportingWarning" },
          { p: "Security.reportingInstruction" },
          { emails: REPORT_EMAILS },
          { p: "Security.reportingResponseTime" },
        ]),
      ),
      section(
        "what-to-include",
        "Security.whatToIncludeTitle",
        policyBody([
          { p: "Security.whatToIncludeIntro" },
          { list: [1, 2, 3, 4, 5, 6, 7].map((n) => `Security.includeItem${n}`) },
        ]),
      ),
      section(
        "disclosure-policy",
        "Security.disclosureTitle",
        policyBody([{ p: "Security.disclosurePolicy" }, { p: "Security.disclosureFollowUp" }], {
          link: "https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure",
        }),
      ),
      section("preferred-language", "Security.languageTitle", policyBody([{ p: "Security.languageText" }])),
    ],
  };

  const guideline = (name: string) => [
    { h3: `CodeOfConduct.${name}Title` },
    { labelled: [`CodeOfConduct.${name}ImpactLabel`, `CodeOfConduct.${name}ImpactText`] as [string, string] },
    { labelled: [`CodeOfConduct.${name}ConsequenceLabel`, `CodeOfConduct.${name}ConsequenceText`] as [string, string] },
  ];
  const codeOfConduct = {
    _id: "codeOfConduct",
    _type: "legalPage",
    name: "Code of conduct",
    hero: policyHero("CodeOfConduct"),
    seo: policySeo("CodeOfConduct"),
    sections: [
      section(
        "our-pledge",
        "CodeOfConduct.pledgeTitle",
        policyBody([{ p: "CodeOfConduct.pledgeText1" }, { p: "CodeOfConduct.pledgeText2" }]),
      ),
      section(
        "our-standards",
        "CodeOfConduct.standardsTitle",
        policyBody([
          { p: "CodeOfConduct.standardsPositiveIntro" },
          { list: [1, 2, 3, 4, 5].map((n) => `CodeOfConduct.standardsPositive${n}`) },
          { p: "CodeOfConduct.standardsNegativeIntro" },
          { list: [1, 2, 3, 4, 5].map((n) => `CodeOfConduct.standardsNegative${n}`) },
        ]),
      ),
      section(
        "enforcement-responsibilities",
        "CodeOfConduct.enforcementResponsibilitiesTitle",
        policyBody([
          { p: "CodeOfConduct.enforcementResponsibilitiesText1" },
          { p: "CodeOfConduct.enforcementResponsibilitiesText2" },
        ]),
      ),
      section("scope", "CodeOfConduct.scopeTitle", policyBody([{ p: "CodeOfConduct.scopeText" }])),
      section(
        "reporting",
        "CodeOfConduct.reportingTitle",
        policyBody([
          { p: "CodeOfConduct.reportingIntro" },
          { emails: REPORT_EMAILS },
          { p: "CodeOfConduct.reportingFollowUp" },
        ]),
      ),
      section(
        "enforcement-guidelines",
        "CodeOfConduct.guidelinesTitle",
        policyBody([
          { p: "CodeOfConduct.guidelinesIntro" },
          ...guideline("correction"),
          ...guideline("warning"),
          ...guideline("temporaryBan"),
          ...guideline("permanentBan"),
        ]),
      ),
      section(
        "attribution",
        "CodeOfConduct.attributionTitle",
        policyBody([{ p: "CodeOfConduct.attributionText" }], {
          covenantLink: "https://www.contributor-covenant.org",
          versionLink: "https://www.contributor-covenant.org/version/2/1/code_of_conduct/",
        }),
      ),
    ],
  };

  const privacyHero = {
    title: string("PrivacyPolicyPage.heading"),
  };

  return { home, about, security, codeOfConduct, privacyHero };
};
