import { defineField, defineType } from "sanity";
import { baseValue, requireBaseLanguage } from "./localized";

// Building blocks the page documents share. Every text is translated.

export const pageHero = defineType({
  name: "pageHero",
  title: "Page header",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "internationalizedArrayString", description: "The small label above the title." }),
    defineField({ name: "title", type: "internationalizedArrayString", validation: requireBaseLanguage }),
    defineField({ name: "description", type: "internationalizedArrayText" }),
  ],
});

export const seo = defineType({
  name: "seo",
  title: "Search and sharing",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: "title", type: "internationalizedArrayString", description: "The browser tab and search result title." }),
    defineField({ name: "description", type: "internationalizedArrayText", description: "The search result summary." }),
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
