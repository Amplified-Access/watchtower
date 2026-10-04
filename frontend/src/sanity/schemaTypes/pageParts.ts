import { defineField, defineType } from "sanity";
import { baseValue, requireBaseLanguage, warnLongerThan } from "./localized";

// Building blocks the page documents share. Every text is translated.

// The privacy policy's header is only its title (and the date, set on the
// document), so the label and description are hidden there.
const isPrivacyPolicy = ({ document }: { document?: { _id?: string } }) =>
  /(^|\.)privacyPolicy$/.test(document?._id ?? "");

export const pageHero = defineType({
  name: "pageHero",
  title: "Page header",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      type: "internationalizedArrayString",
      description: "The small label above the title.",
      hidden: isPrivacyPolicy,
    }),
    defineField({ name: "title", type: "internationalizedArrayString", validation: requireBaseLanguage }),
    defineField({ name: "description", type: "internationalizedArrayText", hidden: isPrivacyPolicy }),
  ],
});

// How a page appears in search results, in AI assistants' citations and when
// its link is shared. Every field is optional: without one, the page uses its
// own title, summary or image, or the site's.
export const seo = defineType({
  name: "seo",
  title: "Search and sharing",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      type: "internationalizedArrayString",
      description:
        "The browser tab and search result title. Leave out “WatchTower”: the site adds it. About 60 characters at most.",
      validation: warnLongerThan(60),
    }),
    defineField({
      name: "description",
      type: "internationalizedArrayText",
      description:
        "The summary under the title in search results and link previews. Say what the page offers, in a sentence or two of 120 to 160 characters.",
      validation: warnLongerThan(160),
    }),
    defineField({
      name: "image",
      title: "Share image",
      type: "image",
      description:
        "Shown when the link is shared on social media and in messaging apps. Cropped to 1200 by 630 around the focal point, so keep the subject near it.",
      options: { hotspot: true },
    }),
  ],
});

export const figure = defineType({
  name: "figure",
  title: "Figure",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "string",
      description: "The number as shown, e.g. “2,000+”. The same in every language.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "label", type: "internationalizedArrayString", validation: requireBaseLanguage }),
  ],
  preview: {
    select: { value: "value", label: "label" },
    prepare: ({ value, label }) => ({ title: `${value ?? ""} ${baseValue(label) ?? ""}` }),
  },
});

export const step = defineType({
  name: "step",
  title: "Step",
  type: "object",
  fields: [
    defineField({ name: "title", type: "internationalizedArrayString", validation: requireBaseLanguage }),
    defineField({ name: "description", type: "internationalizedArrayText", validation: requireBaseLanguage }),
  ],
  preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: baseValue(title) }) },
});

export const faqItem = defineType({
  name: "faqItem",
  title: "Question",
  type: "object",
  fields: [
    defineField({ name: "question", type: "internationalizedArrayString", validation: requireBaseLanguage }),
    defineField({ name: "answer", type: "internationalizedArrayText", validation: requireBaseLanguage }),
  ],
  preview: { select: { title: "question" }, prepare: ({ title }) => ({ title: baseValue(title) }) },
});

// A logo in the home page's scrolling row of partners. Not translated: the
// name and logo are the same in every language.
export const partnerLogo = defineType({
  name: "partnerLogo",
  title: "Partner",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "The partner's name. Screen readers read it in place of the logo.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      type: "image",
      description: "A PNG with a transparent background, or an SVG. It is shown in grey.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "size",
      type: "string",
      description: "Small shows the logo at half the height, for one that looks heavier than the others.",
      options: {
        list: [
          { title: "Regular", value: "regular" },
          { title: "Small", value: "small" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "regular",
    }),
  ],
  preview: { select: { title: "name", media: "logo" } },
});
