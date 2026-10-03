import { defineField, defineType } from "sanity";
import { Search } from "lucide-react";
import { SEO_PAGE_KEYS, type SeoPageKey } from "../../lib/seo/defaults";
import { warnLongerThan } from "./localized";

// How the site appears in search results, AI assistants and link previews,
// for what no page document covers: the site-wide description and share
// image, and the pages whose content is code (the maps, forms and listings).
// The Home and About pages and each case study have their own "Search and
// sharing" fields.
const PAGES: Record<SeoPageKey, { title: string; description?: string }> = {
  caseStudies: { title: "Case studies", description: "The list of case studies (/case-studies)." },
  maps: { title: "Maps", description: "The maps page (/maps)." },
  liveMap: { title: "Live incident map", description: "/maps/live-incident-map" },
  thematicMap: {
    title: "Thematic maps",
    description:
      "One map per incident type (/maps/<type>). Write {type} where the incident type's name goes, e.g. “{type} map”.",
  },
  report: { title: "Report an incident", description: "The anonymous report form (/anonymous-reports)." },
  alerts: { title: "Alerts", description: "The alert sign-up (/alerts)." },
  chat: { title: "Ask WatchTower", description: "The chat assistant (/chat)." },
  registerOrganization: { title: "Create a deployment", description: "Organisation sign-up (/register-organization)." },
  signIn: { title: "Sign in", description: "/sign-in" },
};

export const seoSettings = defineType({
  name: "seoSettings",
  title: "Search and sharing",
  type: "document",
  icon: Search,
  groups: [
    { name: "site", title: "Whole site", default: true },
    { name: "pages", title: "Pages" },
  ],
  fields: [
    defineField({
      name: "description",
      type: "internationalizedArrayText",
      group: "site",
      description:
        "What WatchTower is, in a sentence or two of 120 to 160 characters. Used for pages without a description of their own, and by search engines and AI assistants to describe the site.",
      validation: warnLongerThan(160),
    }),
    defineField({
      name: "image",
      title: "Share image",
      type: "image",
      group: "site",
      description:
        "The default image when a link to the site is shared. Without one, a WatchTower banner is used. Cropped to 1200 by 630 around the focal point.",
      options: { hotspot: true },
    }),
    ...SEO_PAGE_KEYS.map((key) =>
      defineField({ name: key, type: "seo", group: "pages", ...PAGES[key] }),
    ),
  ],
  preview: { prepare: () => ({ title: "Search and sharing" }) },
});
