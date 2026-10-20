import robots from "./robots";

describe("robots.txt", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("welcomes every crawler, AI crawlers by name, to the public site in production", () => {
    process.env.VERCEL_ENV = "production";
    const result = robots();
    const rules = [result.rules].flat();
    expect(rules.map((rule) => rule.userAgent)).toEqual(["*", expect.arrayContaining(["GPTBot", "ClaudeBot", "PerplexityBot"])]);
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(expect.arrayContaining(["/studio", "/api/", "/admin"]));
    }
    expect(result.sitemap).toBe("https://www.thewatchtower.tech/sitemap.xml");
  });

  it("turns every crawler away from staging and previews", () => {
    process.env.VERCEL_ENV = "preview";
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("indexes only this site's production, not another Vercel project's", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "thewatchtower.tech";
    expect(robots().sitemap).toBeDefined();
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "watchtower-test.vercel.app";
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
