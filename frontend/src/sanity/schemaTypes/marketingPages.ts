import { defineArrayMember, defineField, defineType } from "sanity";
import { House, Info } from "lucide-react";
import { baseValue, requireBaseLanguage } from "./localized";

// The home and about pages. The layout (images, links, order of sections) is
// code; these hold every text on them, section by section, so editors can
// change the wording and translations without a deploy. Headings whose
// design breaks them over two lines keep the break: press Enter in the text.

type TextOptions = {
  title?: string;
  description?: string;
  /** Only for `text`: the height of the box. */
  rows?: number;
  validation?: typeof requireBaseLanguage;
};

const string = (name: string, { rows: _rows, ...options }: TextOptions = {}) =>
  defineField({ name, type: "internationalizedArrayString", ...options });
const text = (name: string, options: TextOptions = {}) =>
  defineField({ name, type: "internationalizedArrayText", ...options });
const section = (name: string, title: string, fields: ReturnType<typeof defineField>[], description?: string) =>
  defineField({ name, title, type: "object", description, options: { collapsible: true }, fields });

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  icon: House,
  fields: [
    section("hero", "Header", [
      string("titleLine1", { title: "Title, first line", validation: requireBaseLanguage }),
      string("titleLine2", { title: "Title, second line" }),
      text("description", { validation: requireBaseLanguage }),
      string("primaryCta", { title: "Main button", description: "Opens the report form." }),
      string("secondaryCta", { title: "Second button", description: "Opens the sign-in page." }),
    ]),
    section("explore", "Explore the map", [string("heading"), text("description")]),
    defineField({
      name: "stats",
      title: "Figures",
      type: "array",
      description: "The band of figures under the map. Also shown on the About page.",
      of: [defineArrayMember({ type: "figure" })],
      validation: (rule) => rule.max(4),
    }),
    section(
      "howItWorks",
      "How it works",
      [
        string("heading"),
        text("description"),
        defineField({ name: "steps", type: "array", of: [defineArrayMember({ type: "step" })] }),
      ],
    ),
    section("speakNaturally", "Report in your language", [
      text("title", { rows: 2, description: "Press Enter where the heading should break." }),
      text("description"),
      string("cta", { title: "Button" }),
    ]),
    section(
      "insights",
      "Insights",
      [
        string("label"),
        string("heading"),
        text("description"),
        string("cta", { title: "Link to all insights" }),
        string("readStory", { title: "Card link" }),
        defineField({
          name: "sampleTitles",
          title: "Sample stories",
          description: "Titles shown while there are no published insights yet.",
          type: "array",
          of: [
            defineArrayMember({
              name: "sampleStory",
              type: "object",
              fields: [string("title")],
            }),
          ],
        }),
      ],
      "Hidden on the site until insights launch.",
    ),
    section("faqs", "Questions", [
      string("label", { description: "Also the label of the About page's questions." }),
      string("heading"),
      text("description"),
      defineField({ name: "items", title: "Questions", type: "array", of: [defineArrayMember({ type: "faqItem" })] }),
    ]),
    section("impact", "Impact", [string("title"), text("description")], "Not shown on the site at the moment."),
    section(
      "banner",
      "Banner above the footer",
      [string("text"), string("cta", { title: "Button" })],
      "The blue strip at the bottom of the Home and About pages.",
    ),
    defineField({
      name: "seo",
      type: "seo",
      description: "The site's main search result. The title shows as “WatchTower | <title>”.",
    }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  icon: Info,
  description: "The figures and the bottom banner are edited on the Home page.",
  fields: [
    section("hero", "Header", [
      string("title", { validation: requireBaseLanguage }),
      text("description"),
    ]),
    defineField({
      name: "steps",
      type: "array",
      description:
        "Numbered 01, 02, 03 on the page. Each has its screenshots, in this order: reporting, the maps, case studies.",
      of: [
        defineArrayMember({
          name: "aboutStep",
          title: "Step",
          type: "object",
          fields: [
            string("label", { description: "Shown after the number, e.g. “01. Report”." }),
            text("title", { rows: 2, description: "Press Enter where the heading should break." }),
            text("description"),
          ],
          preview: { select: { title: "label" }, prepare: ({ title }) => ({ title: baseValue(title) }) },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
    section("languages", "Languages", [
      string("heading"),
      text("description", { description: "Write {count} where the number of languages goes, if you need it." }),
    ]),
    section("audiences", "Who it is for", [
      text("heading", { rows: 3, description: "Press Enter where the heading should break." }),
      defineField({
        name: "items",
        title: "Audiences",
        type: "array",
        of: [
          defineArrayMember({
            name: "audience",
            type: "object",
            fields: [
              string("label", { description: "Above the card, e.g. “Communities”." }),
              string("title"),
              text("description"),
            ],
            preview: { select: { title: "label" }, prepare: ({ title }) => ({ title: baseValue(title) }) },
          }),
        ],
      }),
    ]),
    section("safety", "Your safety", [
      text("title", { rows: 2, description: "Press Enter where the heading should break." }),
      text("description"),
      defineField({ name: "items", title: "Questions", type: "array", of: [defineArrayMember({ type: "faqItem" })] }),
    ]),
    section("cta", "Call to action", [
      string("title"),
      text("description"),
      string("primaryCta", { title: "Main button", description: "Opens the report form." }),
      string("secondaryCta", { title: "Second button", description: "Opens the live map." }),
    ]),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});
