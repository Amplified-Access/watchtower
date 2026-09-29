import { defineArrayMember, defineField, defineType } from "sanity";
import { Scale } from "lucide-react";
import { baseValue, requireBaseLanguage } from "./localized";

// A long-form policy page (privacy policy today; terms or a cookie policy can
// reuse it). The page header stays in `messages/*.json` with the rest of the
// UI copy; this holds the policy text, split into sections for the numbered
// table of contents. Section anchors are shared across languages so links
// such as `#contact-us` work whatever the reader's language.
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
    defineField({
      name: "lastUpdated",
      type: "date",
      description: "Shown as “Last updated: <month year>”. Change it whenever the policy text changes.",
      validation: (rule) => rule.required(),
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
              validation: requireBaseLanguage,
            }),
            defineField({
              name: "anchor",
              type: "slug",
              description: "The #anchor the table of contents links to. Shared by every language.",
              options: { source: (_doc, { parent }) => baseValue((parent as { title?: never }).title) ?? "" },
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
            prepare: ({ title, subtitle }) => ({ title: baseValue(title), subtitle: `#${subtitle ?? ""}` }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: "name", subtitle: "lastUpdated" } },
});
