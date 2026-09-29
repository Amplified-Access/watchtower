import { defineField, defineType } from "sanity";
import { requireBaseLanguage } from "./localized";

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
