import type { CaseStudy } from "@/lib/sanity/types";
import { caseStudyArticleNode, homeGraph, ORGANIZATION_ID, pageGraph, WEBSITE_ID } from "./structured-data";

type Node = Record<string, unknown>;
const nodes = (graph: Node) => graph["@graph"] as Node[];

// Every {"@id": …} reference in the graph, except a node's own @id.
const references = (value: unknown, own = true): string[] => {
  if (Array.isArray(value)) return value.flatMap((item) => references(item, false));
  if (!value || typeof value !== "object") return [];
  const entries = Object.entries(value);
  const ref = !own && entries.length === 1 && typeof (value as Node)["@id"] === "string" ? [(value as Node)["@id"] as string] : [];
  return [...ref, ...entries.filter(([key]) => key !== "@id").flatMap(([, item]) => references(item, false))];
};

const expectSelfContained = (graph: Node) => {
  const ids = new Set(nodes(graph).map((node) => node["@id"]));
  for (const node of nodes(graph)) {
    for (const id of references(node)) expect(ids).toContain(id);
  }
};

describe("structured data", () => {
  it("links the home page to the site, its publisher and the source code, and answers its questions", () => {
    const graph = homeGraph({
      name: "Report civic incidents in your language",
      description: "Description.",
      siteDescription: "Site.",
      locale: "en",
      faqs: [{ _key: "a", question: "What is WatchTower?", answer: "A tool." }, { _key: "b", question: "", answer: "" }],
    });
    expectSelfContained(graph);
    const types = nodes(graph).map((node) => node["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "SoftwareSourceCode", ["WebPage", "FAQPage"]]);
    const page = nodes(graph)[3];
    expect(page.mainEntity).toEqual([
      { "@type": "Question", name: "What is WatchTower?", acceptedAnswer: { "@type": "Answer", text: "A tool." } },
    ]);
    expect(page.isPartOf).toEqual({ "@id": WEBSITE_ID });
  });

  it("shares Amplified Access's own @id for the publisher", () => {
    expect(ORGANIZATION_ID).toBe("https://www.amplifiedaccess.org/#organization");
  });

  it("gives other pages breadcrumbs from Home, through their parents", () => {
    const graph = pageGraph({
      path: "/maps/live-incident-map",
      name: "Live incident map",
      description: "Live.",
      locale: "sw",
      siteDescription: "Site.",
      homeName: "Nyumbani",
      parents: [{ name: "Ramani", path: "/maps" }],
    });
    expectSelfContained(graph);
    const breadcrumb = nodes(graph).find((node) => node["@type"] === "BreadcrumbList")!;
    expect(breadcrumb.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Nyumbani", item: "https://www.thewatchtower.tech/" },
      { "@type": "ListItem", position: 2, name: "Ramani", item: "https://www.thewatchtower.tech/maps" },
      { "@type": "ListItem", position: 3, name: "Live incident map", item: "https://www.thewatchtower.tech/maps/live-incident-map" },
    ]);
  });

  it("describes a case study as an Article with Google's recommended fields", () => {
    const study = {
      slug: "water-access-kampala",
      title: "When access to water becomes uncertain",
      summary: "Summary.",
      category: { slug: "water", title: "Water & Sanitation" },
      location: "Kampala, Uganda",
      publishedAt: "2026-03-01",
      updatedAt: "2026-04-01T10:00:00Z",
      bodyLanguage: "en",
    } as CaseStudy;
    const article = caseStudyArticleNode(study, null);
    expect(article).toMatchObject({
      "@type": "Article",
      headline: study.title,
      image: "https://www.thewatchtower.tech/og-image.png",
      datePublished: "2026-03-01",
      dateModified: "2026-04-01T10:00:00Z",
      author: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: { "@id": "https://www.thewatchtower.tech/case-studies/water-access-kampala#webpage" },
      contentLocation: { "@type": "Place", name: "Kampala, Uganda" },
    });
  });
});
