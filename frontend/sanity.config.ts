import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { BookOpen, FileText, House, Info, Scale, Search, ShieldCheck, Tag, Users } from "lucide-react";
import { dataset, projectId } from "./src/sanity/env";
import { BASE_LANGUAGE, LANGUAGES } from "./src/sanity/languages";
import { schemaTypes } from "./src/sanity/schemaTypes";

// The Studio, embedded in the site at /studio (src/app/studio). The Sanity CLI
// reads this file too (schema validation, typegen), which is why it sits at
// the frontend root and imports relatively.

// Singletons: one fixed document per page, opened straight from the sidebar
// and never created or deleted by editors. The IDs are what the site reads.
const SINGLETONS = [
  { id: "homePage", type: "homePage", title: "Home", icon: House },
  { id: "aboutPage", type: "aboutPage", title: "About", icon: Info },
  { id: "privacyPolicy", type: "legalPage", title: "Privacy policy", icon: Scale },
  { id: "security", type: "legalPage", title: "Security", icon: ShieldCheck },
  { id: "codeOfConduct", type: "legalPage", title: "Code of conduct", icon: Users },
];
// Not a page: how the site appears in search and link previews.
const SEO_SETTINGS = { id: "seoSettings", type: "seoSettings", title: "Search and sharing", icon: Search };
const SINGLETON_TYPES = new Set([...SINGLETONS, SEO_SETTINGS].map((s) => s.type));

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
            S.listItem()
              .title("Pages")
              .id("pages")
              .icon(FileText)
              .child(
                S.list()
                  .title("Pages")
                  .items(
                    SINGLETONS.map(({ id, type, title, icon }) =>
                      S.listItem()
                        .title(title)
                        .id(id)
                        .icon(icon)
                        .child(S.document().schemaType(type).documentId(id).title(title)),
                    ),
                  ),
              ),
            S.listItem()
              .title(SEO_SETTINGS.title)
              .id(SEO_SETTINGS.id)
              .icon(SEO_SETTINGS.icon)
              .child(S.document().schemaType(SEO_SETTINGS.type).documentId(SEO_SETTINGS.id).title(SEO_SETTINGS.title)),
            S.divider(),
            S.documentTypeListItem("caseStudy").title("Case studies").icon(BookOpen),
            S.documentTypeListItem("caseStudyCategory").title("Case study categories").icon(Tag),
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
        documentTypes: ["homePage", "aboutPage", "caseStudy", "caseStudyCategory", "legalPage", "seoSettings"],
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
