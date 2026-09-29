import { defineArrayMember, defineField, defineType } from "sanity";
import { BarChart3, ImageIcon, MapPinned } from "lucide-react";

// A case study write-up in one language. It is the value type of
// `internationalizedArrayCaseStudyBody`, so every language gets its own
// complete body — images and figures included, since captions and labels
// are translated too.
export const caseStudyBody = defineType({
  name: "caseStudyBody",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "url",
                validation: (rule) =>
                  rule.required().uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      name: "bodyImage",
      type: "image",
      title: "Image",
      icon: ImageIcon,
      options: { hotspot: true },
      validation: (rule) => rule.required().assetRequired(),
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
          description: "Describe the image for people using screen readers.",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineArrayMember({
      name: "stats",
      type: "object",
      title: "Figures",
      icon: BarChart3,
      fields: [
        defineField({
          name: "items",
          type: "array",
          validation: (rule) => rule.min(1).max(4),
          of: [
            defineArrayMember({
              name: "stat",
              type: "object",
              fields: [
                defineField({ name: "value", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "unit", type: "string", description: "Optional, e.g. “months”." }),
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "value", subtitle: "label" } },
            }),
          ],
        }),
      ],
      preview: {
        select: { items: "items" },
        prepare: ({ items }: { items?: { value?: string; label?: string }[] }) => ({
          title: "Figures",
          subtitle: items?.map((item) => `${item.value} ${item.label}`).join(" · "),
        }),
      },
    }),
    defineArrayMember({
      name: "mapLink",
      type: "object",
      title: "“Explore on map” link",
      icon: MapPinned,
      fields: [
        defineField({
          name: "href",
          type: "string",
          title: "Map path",
          initialValue: "/maps/live-incident-map",
          validation: (rule) => rule.required().regex(/^\//, { name: "site path" }),
        }),
      ],
      preview: { select: { subtitle: "href" }, prepare: ({ subtitle }) => ({ title: "Explore on map", subtitle }) },
    }),
  ],
});
