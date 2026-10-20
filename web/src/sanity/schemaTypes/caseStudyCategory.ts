import { defineField, defineType } from "sanity";
import { Tag } from "lucide-react";
import { baseValue, requireBaseLanguage } from "./localized";

// The filter chips on /case-studies. The slug is what the page's `?category=`
// query parameter carries, so it stays the same in every language.
export const caseStudyCategory = defineType({
  name: "caseStudyCategory",
  title: "Case study category",
  type: "document",
  icon: Tag,
  fields: [
    defineField({
      name: "title",
      type: "internationalizedArrayString",
      validation: requireBaseLanguage,
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in the page address when filtering. Changing it breaks shared filter links.",
      options: {
        source: (doc) => baseValue(doc.title as never) ?? "",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Chips are shown in ascending order.",
      initialValue: 0,
    }),
  ],
  orderings: [{ title: "Chip order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
    prepare: ({ title, subtitle }) => ({ title: baseValue(title), subtitle }),
  },
});
