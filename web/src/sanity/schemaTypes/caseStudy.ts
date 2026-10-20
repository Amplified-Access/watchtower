import { defineField, defineType } from "sanity";
import { BookOpen } from "lucide-react";
import { baseValue, requireBaseLanguage } from "./localized";

// One case study, all languages in the same document. The site has no
// language in its URLs (the locale is a cookie), so a case study has one
// slug; what differs per language — title, summary, place names, image
// descriptions and the write-up — are internationalized arrays. Everything
// else (category, date, cover image, featured flag) is stored once.
export const caseStudy = defineType({
  name: "caseStudy",
  title: "Case study",
  type: "document",
  icon: BookOpen,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "listing", title: "Listing" },
    { name: "seo", title: "Search and sharing" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "internationalizedArrayString",
      group: "content",
      validation: requireBaseLanguage,
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "listing",
      description: "The page address: /case-studies/<slug>. Shared by every language.",
      options: {
        source: (doc) => baseValue(doc.title as never) ?? "",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      type: "internationalizedArrayText",
      group: "content",
      description: "One or two sentences, shown on cards and under the title.",
      validation: requireBaseLanguage,
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "caseStudyCategory" }],
      group: "listing",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      type: "internationalizedArrayString",
      group: "listing",
      description: "Where the study took place, e.g. “Kampala, Uganda”. Also a filter on the listing page.",
      validation: requireBaseLanguage,
    }),
    defineField({
      name: "deployment",
      type: "internationalizedArrayString",
      group: "listing",
      description: "Optional. The deployment the study came from, shown in the page header.",
    }),
    defineField({
      name: "publishedAt",
      type: "date",
      group: "listing",
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      type: "boolean",
      group: "listing",
      description: "Featured studies appear in the block above the filters instead of the main list.",
      initialValue: false,
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Cover image",
      group: "content",
      options: { hotspot: true },
      validation: (rule) => rule.required().assetRequired(),
      fields: [
        defineField({
          name: "alt",
          type: "internationalizedArrayString",
          title: "Alternative text",
          description: "Describe the image for people using screen readers.",
          validation: requireBaseLanguage,
        }),
      ],
    }),
    defineField({
      name: "body",
      type: "internationalizedArrayCaseStudyBody",
      group: "content",
      description:
        "The full write-up. Optional: without one, the page shows the summary as its introduction.",
    }),
    defineField({
      name: "seo",
      type: "seo",
      group: "seo",
      description: "Optional. Without these, search results and link previews use the title, summary and cover image.",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", date: "publishedAt", featured: "featured", media: "image" },
    prepare: ({ title, date, featured, media }) => ({
      title: baseValue(title),
      subtitle: [date, featured && "Featured"].filter(Boolean).join(" · "),
      media,
    }),
  },
});
