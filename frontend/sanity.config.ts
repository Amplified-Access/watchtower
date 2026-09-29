import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { BookOpen, Scale, Tag } from "lucide-react";
import { dataset, projectId } from "./src/sanity/env";
import { BASE_LANGUAGE, LANGUAGES } from "./src/sanity/languages";
import { schemaTypes } from "./src/sanity/schemaTypes";

// The Studio, embedded in the site at /studio (src/app/studio). The Sanity CLI
// reads this file too (schema validation, typegen), which is why it sits at
// the frontend root and imports relatively.

// Singletons: one fixed document each, opened straight from the sidebar and
// never created or deleted by editors.
const SINGLETONS = [{ id: "privacyPolicy", type: "legalPage", title: "Privacy policy" }];
const SINGLETON_TYPES = new Set(SINGLETONS.map((s) => s.type));

export default defineConfig({
  name: "default",
  title: "Watchtower",
  basePath: "/studio",
  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.documentTypeListItem("caseStudy").title("Case studies").icon(BookOpen),
            S.documentTypeListItem("caseStudyCategory").title("Case study categories").icon(Tag),
            S.divider(),
            ...SINGLETONS.map(({ id, type, title }) =>
              S.listItem()
                .title(title)
                .id(id)
                .icon(Scale)
                .child(S.document().schemaType(type).documentId(id).title(title)),
            ),
          ]),
    }),
    // Field-level translation: every translatable field holds one value per
    // language. With 13 languages the language filter (the globe button at
    // the top of a document) keeps the form readable: editors pick the
    // languages they work in and the rest are hidden, not deleted.
    // No top-level `defaultLanguages`: it adds an empty English item to every
    // translatable field that lacks one whenever a document is opened, which
    // turns optional empty fields into unpublished changes.
    internationalizedArray({
      languages: LANGUAGES,
      fieldTypes: ["string", "text", "caseStudyBody", "policyBody"],
      buttonLocations: ["field", "document"],
      languageDisplay: "titleAndCode",
      languageFilter: {
        documentTypes: ["caseStudy", "caseStudyCategory", "legalPage"],
        defaultLanguages: [BASE_LANGUAGE],
      },
    }),
    visionTool({ defaultApiVersion: "2025-10-15" }),
  ],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },

  document: {
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
});
