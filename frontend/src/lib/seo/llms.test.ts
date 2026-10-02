import { portableTextToMarkdown } from "./llms";
import type { CaseStudyBodyBlock, PolicyBodyBlock } from "@/lib/sanity/types";

const block = (text: string, extra: Record<string, unknown> = {}, marks: string[] = [], markDefs: unknown[] = []) =>
  ({ _type: "block", _key: text, style: "normal", markDefs, children: [{ _type: "span", _key: "s", text, marks }], ...extra }) as never;

describe("portableTextToMarkdown", () => {
  it("nests headings under the given depth and keeps quotes, bold, italics and links", () => {
    const body: CaseStudyBodyBlock[] = [
      block("Context", { style: "h2" }),
      block("Detail", { style: "h3" }),
      block("Said a resident.", { style: "blockquote" }),
      block("bold", {}, ["strong"]),
      block("the map", {}, ["l1"], [{ _key: "l1", _type: "link", href: "/maps" }]),
    ];
    expect(portableTextToMarkdown(body, 4).split("\n\n")).toEqual([
      "#### Context",
      "##### Detail",
      "> Said a resident.",
      "**bold**",
      "[the map](https://www.thewatchtower.tech/maps)",
    ]);
  });

  it("writes figures, map links and policy blocks as text, groups bullets and leaves images out", () => {
    const body = [
      { _type: "stats", _key: "s", items: [{ _key: "a", value: "3", unit: "months", label: "of reports" }] },
      { _type: "mapLink", _key: "m", href: "/maps/live-incident-map" },
      { _type: "bodyImage", _key: "i", url: "https://cdn.sanity.io/x.jpg" },
      block("one", { listItem: "bullet" }),
      block("two", { listItem: "bullet" }),
      { _type: "definitions", _key: "d", items: [{ _key: "a", term: "Report", description: "What you send." }] },
      { _type: "contacts", _key: "c", items: [{ _key: "a", label: "Privacy", email: "privacy@example.org" }] },
      { _type: "callToAction", _key: "a", text: "Write to us", href: "mailto:hello@example.org" },
    ] as (CaseStudyBodyBlock | PolicyBodyBlock)[];
    expect(portableTextToMarkdown(body, 4).split("\n\n")).toEqual([
      "- 3 months: of reports",
      "See it on the map: https://www.thewatchtower.tech/maps/live-incident-map",
      "- one\n- two",
      "- **Report**: What you send.",
      "- Privacy: privacy@example.org",
      "[Write to us](mailto:hello@example.org)",
    ]);
  });

  it("returns nothing for no body", () => {
    expect(portableTextToMarkdown(null, 4)).toBe("");
  });
});
