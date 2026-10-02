import type { MetadataRoute } from "next";
import { abs, isIndexable, SITE } from "@/lib/seo/site";

/**
 * AI and answer-engine crawlers, welcomed by name.
 *
 * A crawler that finds a group naming it obeys only that group and ignores
 * `*`, so listing them grants the same access as everyone else while making
 * the intent unmistakable: WatchTower wants to be found and cited by AI
 * assistants (OpenAI, Anthropic, Perplexity, Google, Apple, Meta, Amazon,
 * Common Crawl, Cohere, ByteDance, Mistral, DuckDuckGo, You.com).
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "CCBot",
  "cohere-ai",
  "Bytespider",
  "MistralAI-User",
  "DuckAssistBot",
  "YouBot",
];

/**
 * Not for crawlers: the Studio, API routes and the signed-in dashboards.
 * They need an account, so a crawler would only find sign-in redirects.
 * Rules are prefixes, so "/studio" covers /studio itself as well as the
 * pages under it ("/studio/" would miss the first).
 */
const PRIVATE = ["/studio", "/api/", "/admin", "/superadmin", "/watcher", "/no-organization"];

/**
 * /robots.txt. Production welcomes every crawler to the public site and
 * points them at the sitemap. Staging and previews turn everyone away (and
 * their pages say noindex): they serve the same pages as production and must
 * not compete with it in search results.
 *
 * Hosted on Vercel, which doesn't block AI crawlers by default, so this file
 * is the operative control. If the Vercel Firewall is ever set to challenge
 * bots, these agents must be allowed there too.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const access = { allow: "/", disallow: PRIVATE };
  return {
    rules: [
      { userAgent: "*", ...access },
      { userAgent: AI_CRAWLERS, ...access },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE.url,
  };
}
