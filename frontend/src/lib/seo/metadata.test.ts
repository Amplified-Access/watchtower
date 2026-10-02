import { fillPlaceholders, fullTitle, pageMetadata } from "./metadata";

describe("fullTitle", () => {
  it("adds the brand after a page's title", () => {
    expect(fullTitle("Incident maps")).toBe("Incident maps | WatchTower");
  });

  it("puts the brand first on the home page", () => {
    expect(fullTitle("Report civic incidents in your language", { home: true })).toBe(
      "WatchTower | Report civic incidents in your language",
    );
  });

  it("replaces a brand suffix an editor typed, whatever the separator", () => {
    for (const title of ["Security Policy \u2014 WatchTower", "Security Policy - WatchTower", "Security Policy | watchtower"]) {
      expect(fullTitle(title)).toBe("Security Policy | WatchTower");
    }
  });

  it("leaves a title that names the brand as it is", () => {
    expect(fullTitle("Ask WatchTower")).toBe("Ask WatchTower");
  });

  it("falls back to the site's title when empty", () => {
    expect(fullTitle("")).toBe("WatchTower | Report civic incidents in your language");
  });
});

describe("fillPlaceholders", () => {
  it("fills known placeholders and keeps unknown ones", () => {
    expect(fillPlaceholders("{type} map, {other}", { type: "Flooding" })).toBe("Flooding map, {other}");
  });
});

describe("pageMetadata", () => {
  const base = { path: "/maps", title: "Incident maps", description: "Maps.", locale: "fr" };

  it("sets the canonical URL, Open Graph and X cards from one title and description", () => {
    const metadata = pageMetadata(base);
    expect(metadata.title).toEqual({ absolute: "Incident maps | WatchTower" });
    expect(metadata.alternates?.canonical).toBe("https://www.thewatchtower.tech/maps");
    expect(metadata.openGraph).toMatchObject({
      url: "https://www.thewatchtower.tech/maps",
      siteName: "WatchTower",
      title: "Incident maps | WatchTower",
      locale: "fr_FR",
      images: [{ url: "https://www.thewatchtower.tech/og-image.png", width: 1200, height: 630 }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Incident maps | WatchTower" });
    expect(metadata.robots).toBeUndefined();
  });

  it("uses a page's own image", () => {
    const image = "https://cdn.sanity.io/images/p/d/a.jpg?w=1200";
    expect(pageMetadata({ ...base, image }).openGraph?.images).toEqual([expect.objectContaining({ url: image })]);
  });

  it("describes articles with their dates", () => {
    const metadata = pageMetadata({ ...base, type: "article", publishedTime: "2026-01-01", modifiedTime: "2026-02-01" });
    expect(metadata.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01", modifiedTime: "2026-02-01" });
  });

  it("keeps noindex pages out of search results", () => {
    expect(pageMetadata({ ...base, noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});
