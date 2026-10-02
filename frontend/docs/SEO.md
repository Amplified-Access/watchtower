# Search, sharing and AI discoverability (SEO and GEO)

How WatchTower describes itself to search engines, to AI assistants and answer engines (GEO, "generative engine optimisation"), and to apps that show link previews. The patterns follow the Amplified Access and Monarc Engineering sites: one module of site facts, a metadata builder every page uses, linked JSON-LD graphs, an AI-crawler allowlist in `robots.txt`, and `llms.txt`.

```
src/lib/seo/
├── site.ts              The facts every surface repeats: name, production URL, description, publisher, repo
├── defaults.ts          English search titles and descriptions, the fallback when Sanity has none
├── metadata.ts          pageMetadata(): title, description, canonical, Open Graph, X card for one page
├── page.ts              Server helpers: read search text from Sanity in the reader's language, build metadata and JSON-LD
├── structured-data.ts   JSON-LD @graph builders (Organization, WebSite, WebPage, FAQPage, BreadcrumbList, Article, ItemList)
└── llms.ts              Builds llms.txt and llms-full.txt
src/app/
├── robots.ts            /robots.txt
├── sitemap.ts           /sitemap.xml
├── manifest.ts          /manifest.webmanifest
├── og-image.png/        /og-image.png, the default share image (route.tsx + Epilogue TTFs)
├── llms.txt/            /llms.txt
└── llms-full.txt/       /llms-full.txt
src/components/common/json-ld.tsx   <JsonLd data={…} />
```

## What editors control (Sanity)

Everything a reader or a search engine sees as text is editable in the Studio, in every language, with the same field-by-field English fallback as the rest of the content (see [CMS.md](./CMS.md)):

| Where in the Studio | What it sets |
|---|---|
| **Search and sharing** (sidebar) | The site's description and default share image; the search title and description of the pages whose content is code: Case studies, Maps, Live incident map, Thematic maps (`{type}` is replaced by the incident type), Report an incident, Alerts, Ask WatchTower, Create a deployment, Sign in |
| Home, About: **Search and sharing** field | The page's title, description and share image. Home's title shows as "WatchTower \| \<title\>" |
| A case study: **Search and sharing** tab | Optional overrides of the title, summary and cover image |
| A policy page: **Search and sharing** field | Its title and description (the privacy policy's title is its translated header) |

Titles leave out "WatchTower": the site adds " | WatchTower". A title that ends with the brand anyway ("Security Policy - WatchTower") has it removed and added back the same way (`ownTitle`, `fullTitle`). The Studio warns when a title passes 60 characters or a description 160, where search results cut them off. Share images are cropped to 1200 by 630 around the image's focal point and served as JPEG from Sanity's CDN (`sanityShareImageSrc`).

When a field is empty in every language, the page uses the English default in `lib/seo/defaults.ts`. The seed (`sanity/seed/seo.ts`) fills English from those defaults and the other 12 languages from text the site already had in that language (a page's heading and introduction), so `pnpm sanity:setup` gives editors translated starting points.

## Every page's `<head>`

Public pages call `pageMetadata()` (directly, or through `codePageMetadata()` for the code-built pages), which sets:

- `<title>` and the description
- the **canonical URL** on the production origin (`https://www.thewatchtower.tech`), whatever host served the page and whatever query string it has (`/case-studies?category=…` is canonically `/case-studies`)
- **Open Graph** (`og:title`, `og:description`, `og:url`, `og:image` 1200 by 630, `og:locale` in the reader's language, `og:type`, and for case studies `article:published_time`, `article:modified_time`, `article:section`)
- the **X (Twitter)** large-image card

Next merges metadata shallowly: a page's `openGraph` replaces the root layout's whole `openGraph` object rather than adding to it. That is why `pageMetadata()` sets the site name, locale and image again for every page. The root layout (`app/layout.tsx`) holds the defaults for pages that set nothing (the dashboards): `metadataBase`, the "%s | WatchTower" title template, the description and image from "Search and sharing", the publisher, `robots` and the theme colour.

**Client pages can't export metadata.** The Maps, Alerts, Report and Chat pages were `"use client"` page files; their bodies now live in their feature folders (`features/maps/components/maps-landing/maps-page.tsx`, `components/alerts/alerts-page.tsx`, `features/anonymous-reporting/components/anonymous-report-page.tsx`, `features/chat/components/chat-start-page.tsx`), and `page.tsx` is a small server component that exports `generateMetadata` and renders `<JsonLd>`. Do the same for any new public page: keep `page.tsx` a server component.

**Language.** URLs carry no locale (it is a cookie), so there is one URL per page and no `hreflang`. Crawlers send no cookie and get English; readers get their tab title, share cards and structured data in their language. The WebSite node lists every language the site is offered in (`inLanguage`).

If Sanity can't be reached, `getSeoSettings` returns empty settings and every page falls back to the English defaults, so an outage never takes pages down for want of a description.

**Kept out of search** (`noindex`): password reset pages, chat conversations (one reader's questions, in the URL) and `/no-organization`. Dashboards, the Studio and the API are disallowed in `robots.txt`.

## Staging and previews are never indexed

`isIndexable()` (in `site.ts`) is true only for a production deployment on this site's own domain (`VERCEL_ENV` is `production` and `VERCEL_PROJECT_PRODUCTION_URL` is thewatchtower.tech), or off Vercel altogether. The separate `watchtower-test` project's production is not indexed either. Elsewhere `robots.txt` disallows everything and every page says `noindex, nofollow`, so staging and preview deployments, which serve the same pages, never compete with production in search results.

## Structured data (JSON-LD)

Each public page renders one `@graph` (`<JsonLd data={…} />`, which escapes `<` so Sanity text can't close the script tag). Nodes point at each other by `@id`:

- **Organization** is Amplified Access, under the `@id` amplifiedaccess.org already uses for itself (`https://www.amplifiedaccess.org/#organization`), so the two sites describe one publisher.
- **WebSite** is WatchTower, published by that Organization, with every language it is offered in.
- **SoftwareSourceCode** (home page) points to the open-source repository and its MIT licence.
- **WebPage** (or AboutPage, CollectionPage) for the page, in the reader's language, with a **BreadcrumbList** from Home.
- **FAQPage**: the Home page's questions and the About page's safety questions, from Sanity, so the answers can be quoted directly.
- **Article** for each case study (headline, image, dates, publisher, place, category) and an **ItemList** of case studies on the listing.

Types are limited to ones Google's Rich Results Test accepts without errors. SoftwareApplication is left out on purpose: Google requires ratings and a price for it. Check a page with the [Rich Results Test](https://search.google.com/test/rich-results) or the [Schema Markup Validator](https://validator.schema.org/) after changing a graph.

## Crawlers, sitemap and llms.txt

- **`/robots.txt`** allows everyone, and names the major AI and answer-engine crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot and others) so the welcome is explicit: a crawler that finds its own group ignores `*`. The site is on Vercel, which doesn't block AI crawlers by default; if the Vercel Firewall is ever set to challenge bots, allow these there too.
- **`/sitemap.xml`** lists every indexable page: the fixed pages, every case study and the Sanity pages with the date they last changed, and one thematic map per active incident type from the Go API (left out if the API is unreachable). The older Insights, Reports, Datasets and Organisations pages are left out: they load their content in the browser, which most AI crawlers don't run. They still get their own title, description and canonical URL from a `layout.tsx` (their copy in `messages/*.json`, and for an insight or organisation, its title read from the Go API on the server), so they never pass for the home page.
- **`/llms.txt`** ([llmstxt.org](https://llmstxt.org)) is a curated Markdown index for AI assistants: what WatchTower is, who runs it, its languages, and a linked, one-line summary of every page worth citing, using the search text from Sanity.
- **`/llms-full.txt`** is the full English text of the content pages in one file: what WatchTower is, how it works, the questions and answers, every case study and the policies, converted from Portable Text to Markdown (`portableTextToMarkdown`).

Both text files are generated from Sanity, so a new case study or an edited answer appears in them within the hour (`revalidate = 3600`, and Sanity's tags).

## The default share image

`/og-image.png` is drawn at build time by `app/og-image.png/route.tsx` (`next/og`): the white logo, the headline and the domain on brand blue, in Epilogue. The renderer (Satori) reads TTF but not WOFF2 or variable fonts, so the folder holds two static instances (Regular and SemiBold) cut from `public/fonts/epilogue/epilogue-latin-wght-normal.woff2` with fontTools:

```bash
pip install fonttools brotli
python -c 'from fontTools.ttLib import TTFont; from fontTools.varLib import instancer
for w, n in [(600, "SemiBold"), (400, "Regular")]:
    f = instancer.instantiateVariableFont(TTFont("public/fonts/epilogue/epilogue-latin-wght-normal.woff2"), {"wght": w})
    f.flavor = None; f.save(f"src/app/og-image.png/Epilogue-{n}.ttf")'
```

An image uploaded under "Search and sharing" replaces it as the site's default.

## Adding a public page

1. Keep `page.tsx` a server component; put interactive parts in a client component under `features/`.
2. Export `generateMetadata`: `pageMetadata({ path, title, description, image, locale })`, or for a page with no Sanity document, add a key to `SEO_PAGE_KEYS` and `DEFAULT_PAGE_SEO` (`lib/seo/defaults.ts`), its Studio label to `seoSettings.ts`, its translated starting text to `PAGE_SOURCES` in `sanity/seed/seo.ts`, and use `codePageMetadata(key, path)`.
3. Render `<JsonLd data={await pageJsonLd({ … })} />` (or `codePageJsonLd`), with `parents` for pages below another.
4. Add it to `app/sitemap.ts`, and to `buildLlmsTxt` if it is worth citing.
5. If it shouldn't be found, pass `noindex: true` instead.
