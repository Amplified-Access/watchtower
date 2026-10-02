// Builds /llms.txt and /llms-full.txt (https://llmstxt.org): plain Markdown
// descriptions of the site for AI assistants and answer engines.
//
// - llms.txt is the curated index: what WatchTower is, and a link with a
//   one-line summary for every page worth citing.
// - llms-full.txt is the full text of those pages in one file, for readers
//   with a large context: the Home and About text, every case study and the
//   policies.
//
// Both are generated from Sanity (in English) and the search text in
// "Search and sharing", the same content the pages render, so they can't
// drift from the site. Pure functions of that content, for testing.
import { LANGUAGES } from "@/sanity/languages";
import type { PortableTextBlock } from "@portabletext/react";
import type { CaseStudyBodyBlock, LlmsContent, PolicyBodyBlock } from "@/lib/sanity/types";
import type { SeoPageKey, SeoText } from "./defaults";
import { abs, PUBLISHER, SITE } from "./site";

export type LlmsInput = {
  content: LlmsContent;
  /** The site's description. */
  description: string;
  /** English search text of the code-built pages, Sanity's or the defaults. */
  pages: Record<SeoPageKey, SeoText>;
  aboutDescription: string;
};

const POLICY_PATHS: Record<string, string> = {
  privacyPolicy: "/privacy-policy",
  security: "/security",
  codeOfConduct: "/code-of-conduct",
};

const languageNames = () => {
  const names = LANGUAGES.map((language) => language.title);
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

/** One line: headings that the design breaks over two lines are joined. */
const line = (text: string | null | undefined) => (text ?? "").replace(/\s*\n\s*/g, " ").trim();

/** Site paths made absolute; other links (https:, mailto:) left as they are. */
const absHref = (href: string) => (href.startsWith("/") ? abs(href) : href);

const link = (name: string, href: string, note?: string) =>
  `- [${name}](${absHref(href)})${note ? `: ${line(note)}` : ""}`;

/** Joins Markdown parts with blank lines, dropping empty ones, ending in one newline. */
const document = (parts: (string | null | undefined | false)[]) =>
  `${parts
    .filter((part): part is string => !!part && part.trim() !== "")
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;

// ── Rich text to Markdown ────────────────────────────────────────────────────

type Span = { _type: string; text?: string; marks?: string[] };
type TextBlock = {
  _type: "block";
  style?: string;
  listItem?: string;
  children?: Span[];
  markDefs?: { _key: string; href?: string }[];
};

const spansToMarkdown = ({ children = [], markDefs = [] }: TextBlock) =>
  children
    .map(({ text = "", marks = [] }) => {
      if (!text.trim()) return text;
      let out = text;
      if (marks.includes("em")) out = `_${out}_`;
      if (marks.includes("strong")) out = `**${out}**`;
      const href = markDefs.find((def) => marks.includes(def._key))?.href;
      return href ? `[${out}](${absHref(href)})` : out;
    })
    .join("");

/**
 * A Portable Text body (a case study's or a policy's) as Markdown. A heading
 * (h2) gets `depth` hashes and a subheading (h3) one more, so they nest under
 * the heading that introduces the body. Images are left out: the text around them carries the
 * meaning, and their URLs are no use to a language model.
 */
export const portableTextToMarkdown = (
  blocks: (CaseStudyBodyBlock | PolicyBodyBlock)[] | null | undefined,
  depth: number,
) => {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(list.join("\n"));
    list = [];
  };
  for (const block of blocks ?? []) {
    if (block._type === "block") {
      const text = spansToMarkdown(block as TextBlock).trim();
      const { style, listItem } = block as TextBlock;
      if (listItem) {
        list.push(`- ${text}`);
        continue;
      }
      flush();
      if (!text) continue;
      if (style === "h2") out.push(`${"#".repeat(depth)} ${text}`);
      else if (style === "h3") out.push(`${"#".repeat(depth + 1)} ${text}`);
      else if (style === "blockquote") out.push(`> ${text}`);
      else out.push(text);
      continue;
    }
    flush();
    const custom = block as Exclude<CaseStudyBodyBlock | PolicyBodyBlock, PortableTextBlock>;
    switch (custom._type) {
      case "stats":
        out.push(custom.items.map((stat) => `- ${[stat.value, stat.unit].filter(Boolean).join(" ")}: ${stat.label}`).join("\n"));
        break;
      case "mapLink":
        out.push(`See it on the map: ${absHref(custom.href)}`);
        break;
      case "definitions":
        out.push(custom.items.map((item) => `- **${item.term}**: ${item.description}`).join("\n"));
        break;
      case "callToAction":
        out.push(`[${custom.text}](${absHref(custom.href)})`);
        break;
      case "contacts":
        out.push(custom.items.map((item) => `- ${item.label}: ${item.email}`).join("\n"));
        break;
    }
  }
  flush();
  return out.join("\n\n");
};

// ── The two files ────────────────────────────────────────────────────────────

const introduction = (description: string) => [
  `# ${SITE.name}`,
  `> ${line(description)}`,
  `${SITE.name} is a free, open-source, multilingual reporting and civic intelligence tool built and run by ${PUBLISHER.name} (${PUBLISHER.url}). People report civic incidents and rights violations by voice or text, in the language they speak and without giving their name. ${SITE.name} transcribes, translates and maps the reports, so communities, organisations and institutions can see patterns and act on them. The site is offered in ${LANGUAGES.length} languages: ${languageNames()}.`,
];

export const buildLlmsTxt = ({ content, description, pages, aboutDescription }: LlmsInput) =>
  document([
    ...introduction(description),
    "The links below are the canonical pages for understanding and using WatchTower. The full text of the content pages is in one file at " +
      `${abs("/llms-full.txt")}.`,
    "## Use WatchTower",
    [
      link(pages.report.title, "/anonymous-reports", pages.report.description),
      link(pages.maps.title, "/maps", pages.maps.description),
      link(pages.liveMap.title, "/maps/live-incident-map", pages.liveMap.description),
      link(pages.alerts.title, "/alerts", pages.alerts.description),
      link(pages.chat.title, "/chat", pages.chat.description),
    ].join("\n"),
    "## About",
    [
      link(`About ${SITE.name}`, "/about", aboutDescription),
      link("Frequently asked questions", "/", "What WatchTower is, what can be reported, reporting in your own language, anonymity and what happens to a report."),
    ].join("\n"),
    "## Case studies",
    [
      link(pages.caseStudies.title, "/case-studies", pages.caseStudies.description),
      ...content.caseStudies.map((study) => link(line(study.title), `/case-studies/${study.slug}`, study.summary)),
    ].join("\n"),
    "## For organisations",
    [
      link(pages.registerOrganization.title, "/register-organization", pages.registerOrganization.description),
      link("Source code", SITE.repository, "WatchTower's open-source code (MIT licence): a Go API and a Next.js web app."),
    ].join("\n"),
    "## Policies",
    content.policies
      .filter((policy) => POLICY_PATHS[policy._id])
      .map((policy) => link(line(policy.hero.title), POLICY_PATHS[policy._id], policy.seo.description || policy.hero.description))
      .join("\n"),
    "## Optional",
    [
      link("Full text", "/llms-full.txt", "Every content page above in one Markdown file."),
      link(PUBLISHER.name, PUBLISHER.url, "The organisation that builds and runs WatchTower."),
    ].join("\n"),
  ]);

const question = (q: string, a: string, depth: number) => `${"#".repeat(depth)} ${line(q)}\n\n${a.trim()}`;

export const buildLlmsFull = ({ content, description }: LlmsInput) => {
  const { home, about, caseStudies, policies } = content;
  const languageCount = String(LANGUAGES.length);
  return document([
    ...introduction(description),
    `This file is the full text of WatchTower's public pages, in English, for AI assistants and other large-context readers. The site serves the same content in the other languages. For an index of links, see ${abs("/llms.txt")}.`,

    "## What WatchTower is",
    home?.hero.description,
    about?.hero.description !== home?.hero.description && about?.hero.description,
    about?.hero.objective,

    home && "## How WatchTower works",
    home?.howItWorks.description,
    ...(home?.howItWorks.steps ?? []).map((step, i) => `### ${i + 1}. ${line(step.title)}\n\n${step.description}`),

    home && "## Reporting in your language",
    home && [line(home.speakNaturally.title), home.speakNaturally.description].filter(Boolean).join(" "),
    about && [line(about.languages.heading), about.languages.description.replace(/\{count\}/g, languageCount)].filter(Boolean).join(": "),

    !!home?.stats.length && `## ${line(home.impact.title) || "Impact"}`,
    home?.impact.description,
    home?.stats.map((stat) => `- ${stat.value} ${stat.label}`).join("\n"),

    !!home?.faqs.items.length && "## Frequently asked questions",
    ...(home?.faqs.items ?? []).map((faq) => question(faq.question, faq.answer, 3)),

    !!about?.safety.items.length && `## ${line(about.safety.title) || "Safety and privacy"}`,
    about?.safety.description,
    ...(about?.safety.items ?? []).map((faq) => question(faq.question, faq.answer, 3)),

    caseStudies.length > 0 && "## Case studies",
    ...caseStudies.map((study) =>
      document([
        `### ${line(study.title)}`,
        [
          `URL: ${abs(`/case-studies/${study.slug}`)}`,
          study.location && `Location: ${study.location}`,
          study.category?.title && `Category: ${study.category.title}`,
          study.deployment && `Deployment: ${study.deployment}`,
          `Published: ${study.publishedAt}`,
        ]
          .filter(Boolean)
          .join("\n"),
        study.summary,
        portableTextToMarkdown(study.body, 4),
      ]).trim(),
    ),

    policies.length > 0 && "## Policies",
    ...policies
      .filter((policy) => POLICY_PATHS[policy._id])
      .map((policy) =>
        document([
          `### ${line(policy.hero.title)}`,
          `URL: ${abs(POLICY_PATHS[policy._id])}`,
          policy.hero.description,
          ...policy.sections.map((section) =>
            [section.title && `#### ${line(section.title)}`, portableTextToMarkdown(section.body, 4)]
              .filter(Boolean)
              .join("\n\n"),
          ),
        ]).trim(),
      ),
  ]);
};
