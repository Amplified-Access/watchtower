import { defineArrayMember, defineField, defineType } from "sanity";
import { ArrowRight, BookA, Mail } from "lucide-react";

// One section of a legal page in one language. Bold text stands out as the
// policy's emphasised statements and list titles; subheadings divide a long
// section (the code of conduct's enforcement guidelines).
export const policyBody = defineType({
  name: "policyBody",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Subheading", value: "h3" },
      ],
      lists: [{ title: "Bullets", value: "bullet" }],
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
                type: "string",
                description: "A web address, mailto: link, or #anchor of another section.",
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      name: "definitions",
      type: "object",
      title: "Terms and definitions",
      icon: BookA,
      fields: [
        defineField({
          name: "items",
          type: "array",
          validation: (rule) => rule.min(1),
          of: [
            defineArrayMember({
              name: "definition",
              type: "object",
              fields: [
                defineField({ name: "term", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "description", type: "text", rows: 2, validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "term", subtitle: "description" } },
            }),
          ],
        }),
      ],
      preview: {
        select: { items: "items" },
        prepare: ({ items }: { items?: { term?: string }[] }) => ({
          title: "Terms and definitions",
          subtitle: items?.map((item) => item.term).join(", "),
        }),
      },
    }),
    defineArrayMember({
      name: "callToAction",
      type: "object",
      title: "Arrow link",
      icon: ArrowRight,
      fields: [
        defineField({ name: "text", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "href",
          type: "string",
          description: "A web address, mailto: link, or #anchor of another section.",
          validation: (rule) => rule.required(),
        }),
      ],
      preview: { select: { title: "text", subtitle: "href" } },
    }),
    defineArrayMember({
      name: "contacts",
      type: "object",
      title: "Contact emails",
      icon: Mail,
      fields: [
        defineField({
          name: "items",
          type: "array",
          validation: (rule) => rule.min(1),
          of: [
            defineArrayMember({
              name: "contact",
              type: "object",
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "email", type: "email", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "label", subtitle: "email" } },
            }),
          ],
        }),
      ],
      preview: {
        select: { items: "items" },
        prepare: ({ items }: { items?: { email?: string }[] }) => ({
          title: "Contact emails",
          subtitle: items?.map((item) => item.email).join(", "),
        }),
      },
    }),
  ],
});
