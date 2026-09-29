import { defineArrayMember, defineField, defineType } from "sanity";
import { Scale } from "lucide-react";
import { baseValue, requireBaseLanguage } from "./localized";

// A long-form policy page: the privacy policy, the security policy and the
// code of conduct. It holds the page header, the search title and the text,
// split into sections (the privacy policy lists them in a numbered table of
// contents). Section anchors are shared across languages so links such as
// `#contact-us` work whatever the reader's language.
export const legalPage = defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  icon: Scale,
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "For the Studio only.",
      readOnly: true,
    }),
    defineField({ name: "hero", title: "Page header", type: "pageHero" }),
    defineField({ name: "seo", type: "seo" }),
    defineField({
      name: "lastUpdated",
      type: "date",
      description:
        "Shown as “Last updated: <month year>” on the privacy policy. Change it whenever the policy text changes.",
    }),
    defineField({
      name: "sections",
      type: "array",
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          name: "policySection",
          type: "object",
          fields: [
            defineField({
              name: "title",
              type: "internationalizedArrayString",
              description: "Optional: an untitled section is an introduction, and is left out of the contents.",
            }),
            defineField({
              name: "anchor",
              type: "slug",
              description: "The #anchor the table of contents links to. Shared by every language.",
              options: { source: (_doc, { parent }) => baseValue((parent as { title?: never }).title) ?? "introduction" },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              type: "internationalizedArrayPolicyBody",
              validation: requireBaseLanguage,
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "anchor.current" },
            prepare: ({ title, subtitle }) => ({ title: baseValue(title) ?? "Introduction", subtitle: `#${subtitle ?? ""}` }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: "name", subtitle: "lastUpdated" } },
});
