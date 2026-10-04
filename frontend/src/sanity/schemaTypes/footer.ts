import { defineArrayMember, defineField, defineType } from "sanity";
import { PanelBottom } from "lucide-react";
import { SOCIAL_PLATFORMS } from "../../lib/sanity/social-platforms";
import { baseValue, requireBaseLanguage } from "./localized";

// The footer of every page on the public site. The logo, the watermark and
// the layout are code; the words, links and social profiles are here. (The
// sign-in pages have their own small footer, which is UI copy.)

const PLACES = "A page on the site (“/maps”), a web address (“https://…”) or an email (“mailto:…”).";

export const footerLink = defineType({
  name: "footerLink",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "internationalizedArrayString", validation: requireBaseLanguage }),
    defineField({
      name: "href",
      title: "Goes to",
      type: "url",
      description: PLACES,
      validation: (rule) => rule.required().uri({ allowRelative: true, scheme: ["https", "http", "mailto"] }),
    }),
  ],
  preview: {
    select: { label: "label", href: "href" },
    prepare: ({ label, href }) => ({ title: baseValue(label), subtitle: href }),
  },
});

export const footer = defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  icon: PanelBottom,
  fields: [
    defineField({
      name: "attribution",
      title: "Line under the logo",
      type: "internationalizedArrayString",
      description: "Write {organisation} where the organisation's name goes. It links to the address below.",
    }),
    defineField({
      name: "organisation",
      type: "object",
      description: "Named in the line under the logo. The same in every language.",
      options: { columns: 2 },
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "url", title: "Address", type: "url", validation: (rule) => rule.uri({ scheme: ["https"] }) }),
      ],
    }),
    defineField({
      name: "columns",
      title: "Link columns",
      type: "array",
      description: "Side by side on a computer, two by two on a phone.",
      of: [
        defineArrayMember({
          name: "footerColumn",
          title: "Column",
          type: "object",
          fields: [
            defineField({ name: "heading", type: "internationalizedArrayString", validation: requireBaseLanguage }),
            defineField({ name: "links", type: "array", of: [defineArrayMember({ type: "footerLink" })] }),
          ],
          preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: baseValue(title) }) },
        }),
      ],
      validation: (rule) => rule.max(4).warning("The layout has room for four columns."),
    }),
    defineField({
      name: "social",
      title: "Social profiles",
      type: "array",
      description: "Icons, in this order.",
      of: [
        defineArrayMember({
          name: "socialLink",
          title: "Profile",
          type: "object",
          fields: [
            defineField({
              name: "platform",
              type: "string",
              options: { list: [...SOCIAL_PLATFORMS] },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "Address",
              type: "url",
              validation: (rule) => rule.required().warning("Without an address the icon isn't shown."),
            }),
          ],
          preview: {
            select: { platform: "platform", url: "url" },
            prepare: ({ platform, url }) => ({
              title: SOCIAL_PLATFORMS.find((p) => p.value === platform)?.title ?? platform,
              subtitle: url ?? "No address yet: not shown",
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "copyright",
      type: "internationalizedArrayString",
      description: "Write {year} where the current year goes.",
    }),
    defineField({
      name: "legalLinks",
      title: "Links beside the copyright",
      type: "array",
      of: [defineArrayMember({ type: "footerLink" })],
    }),
  ],
  preview: { prepare: () => ({ title: "Footer" }) },
});
