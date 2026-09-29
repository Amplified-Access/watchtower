# Content management (Sanity)

Editorial content for the Watchtower site: **case studies** (and their categories) and **legal pages** (the privacy policy). Editors change it in the Sanity Studio at **`/studio`** on the site itself, and published changes appear on the site within seconds, on pages readers already have open too (Sanity Live, below). Everything else stays where it was: incident data comes from the Go backend, and UI copy (buttons, headings, page chrome) stays in `messages/*.json`.

```
frontend/
├── sanity.config.ts            Studio: sidebar, plugins, singletons (also read by the Sanity CLI)
├── sanity.cli.ts               CLI: project and dataset for `pnpm exec sanity …`
├── src/pages/studio/[[...tool]].tsx  The /studio route (the app's only Pages Router page)
├── src/sanity/                 Content model (schemaTypes/), languages, env, the Studio component
├── src/lib/sanity/             What the site reads: Sanity Live (live.ts), queries, fetchers, types
├── sanity/seed/                The initial import (see "Seed content")
└── scripts/sanity-setup.sh     One-time project setup
```

## Getting started

```bash
cd frontend
pnpm sanity:setup   # log in to the Sanity CLI, create/pick the project, import the seed, add the env vars
pnpm dev            # the Studio is at http://localhost:3000/studio
```

`pnpm sanity:setup` uses the project in `.env.local` if there is one, and otherwise asks: pick an existing project or leave it empty to create a "Watchtower" project. It creates a **public** dataset (the site reads published documents without a token; drafts are never public), allows `http://localhost:3000` to call the Sanity API (CORS, which the Studio and Sanity Live need), imports the seed content if the dataset has none yet (so re-running it never overwrites Studio edits), checks the site can read it, and adds `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` to `.env.local`.

Without those two variables the site still builds and runs: the case study and privacy policy pages render empty, the server logs a warning, and `/studio` says it isn't set up.

## The embedded Studio

The Studio is a React app rendered by `src/pages/studio/[[...tool]].tsx`: a page (not indexed, and a setup message when Sanity isn't configured) that loads the Studio in the browser only (`next/dynamic` with `ssr: false`), full screen, with its own router under `/studio` (`basePath` in `sanity.config.ts`). It is loaded on that route alone, so no other page's bundle grows.

**Why a Pages Router page in an App Router site.** Sanity v6 uses React 19.2's `Activity`. For the App Router, Next 15 bundles its own React (a 19.2 canary from mid-2025, even in the last 15.5 release) that doesn't export `Activity` yet, so a Studio under `app/` works in `next dev` but fails `next build`. The Pages Router uses the installed `react` instead, which is 19.2.8. It also keeps the site's root layout and global CSS away from the Studio. Two side effects: `react`/`react-dom` are 19.2, and because a `pages/` directory exists, Next types `useParams`, `useSearchParams` and `usePathname` as possibly `null` everywhere, so App Router code handles that (it never is null there). On Next 16, the Studio can move to `app/studio/` and the null handling can go.

- **Sign-in is Sanity's.** Editors log in with their Sanity account (invite them in [sanity.io/manage](https://www.sanity.io/manage) → project → Members). The page itself needs no Watchtower login; without a Sanity account it shows only a sign-in screen, and anonymous users can't read drafts or write.
- **Every origin serving the site must be a CORS origin with credentials**, or the Studio shows "Connect this Studio to your project" and Sanity Live can't connect (pages still render, just without live updates). Setup adds `http://localhost:3000`. Add the others once each:
  ```bash
  pnpm exec sanity cors add https://staging.thewatchtower.tech --credentials
  pnpm exec sanity cors add https://www.thewatchtower.tech --credentials
  ```
  Vercel preview URLs change per deploy; use staging for editing rather than allowing a wildcard.
- **The Studio doesn't use `next-sanity`'s `NextStudio`**, which needs Next 16 in the versions that support Sanity v6; rendering Sanity's own `<Studio>` needs nothing from Next.
- Sanity packages are pinned to a patch range (`~6.16.0`). Upgrade `sanity` and `@sanity/vision` together, deliberately.

## How published changes reach the site

1. **Sanity Live, for pages readers have open.** `src/lib/sanity/live.ts` uses `defineLive` from `next-sanity/live`: every `sanityFetch` result is cached under the sync tags Sanity returns with it, and `<SanityLive />` (rendered by `app/(main)/case-studies/layout.tsx` and the privacy policy page) subscribes the reader's browser to Sanity's Live Content API. When a document is published, it revalidates just the affected tags and refreshes the page in place, without a reload. In testing, an open page showed a published title change 3–8 seconds later. Any page that shows Sanity content must render `<SanityLive />` once.
2. **The webhook, for publishes nobody is watching** (optional, below): drops the `sanity` tag so the next visitor gets fresh content.
3. **A one-minute expiry** on every Sanity fetch, as the safety net for both.

`next-sanity` is pinned to **11.6.13**, the last release supporting Next 15 (12 and later need Next 16). Only its `/live` entry point is used; its declared `sanity ^5` peer is for the Studio helpers we don't use, so `pnpm` reports that one peer mismatch, which is expected. The Sanity client (`createClient`) also comes from `next-sanity`, so there is one client version. On Next 16, move to the current `next-sanity`.

## Deployment

Add `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` to the Vercel project (Preview and Production), and `SANITY_REVALIDATE_SECRET` if you set up the webhook. The Studio ships with the site; there is nothing else to deploy.

### The webhook (optional)

Sanity Live only reaches pages that are open when something is published. So that the next visitor also gets the change at once, rather than within a minute, add a webhook in [sanity.io/manage](https://www.sanity.io/manage) → project → API → Webhooks:

- URL: `https://<site>/api/revalidate`
- Dataset: `production`, trigger on create, update and delete
- Filter: `_type in ["caseStudy", "caseStudyCategory", "legalPage"]`
- Secret: a random string, also set as `SANITY_REVALIDATE_SECRET` in the site's environment

`src/app/api/revalidate/route.ts` checks the signature and drops the `sanity` cache tag.

## How translation works

Watchtower serves 13 languages and its URLs carry no language: the locale is a cookie (`src/i18n/request.ts`), so `/case-studies/water-access-kampala` is the same address in every language. That decided the content model.

**Field-level translation.** Sanity documents two approaches ([Sanity: localization](https://www.sanity.io/docs/studio/localization)):

- *Document-level* ([`@sanity/document-internationalization`](https://www.npmjs.com/package/@sanity/document-internationalization)): one document per language, linked by a metadata document. Good when each language has its own URL and its own publishing schedule.
- *Field-level* ([`sanity-plugin-internationalized-array`](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array)): one document, and each translatable field holds a `{language, value}` item per language.

We use **field-level**. One case study has one slug, one category, one date, one cover image and one "featured" flag, stored once. Only the text differs per language. With document-level translation those shared fields would be copied into 13 documents and drift apart, and the site would need an extra lookup to go from the shared slug to the reader's language. The array form also keeps the number of dataset attributes flat however many languages are added. That matters with 13 languages: an object with one key per language multiplies attributes by the language count.

What each field does:

| Case study field | Translated? |
|---|---|
| title, summary, location, deployment, cover image alt text, body | yes, one value per language |
| slug, category, publishedAt, featured, cover image | no, shared |

Category names are translated (on the category document); category slugs are not, because `?category=` filter links must work in every language.

**English is the base language.** Every translatable field requires an English value. The site asks for the reader's language and **falls back to English field by field** (`src/lib/sanity/queries.ts`, `localized()`), so a partly translated case study shows what exists and English for the rest. Empty values count as missing. When a body or policy section is served in English on a non-English page, the page marks it with `lang="en"`, so screen readers pronounce it correctly and browsers offer to translate it.

**Editing with 13 languages.** Use the globe (language filter) button at the top of a document to show only the languages you work in; hidden languages are kept, not deleted. Under each translatable field, the `+ <language>` buttons add a translation, and "Add missing languages" adds them all.

**Legal text is only published in reviewed translations.** The privacy policy is seeded in English only, and every language falls back to it. Add a translation in the Studio once a reviewed one exists.

## Seed content

`sanity/seed/seed.ndjson` is what `pnpm sanity:setup` imports. It is generated. Edit the inputs and run `pnpm sanity:seed:build`:

- `sanity/seed/source.ts`: the English case studies and privacy policy, moved out of the frontend's old placeholder modules
- `sanity/seed/categories.json`: category names in all 13 languages, moved out of `messages/*.json`
- `sanity/seed/translations/<lang>.json`: case study text in the other 12 languages, keyed like `translations/en.json` (regenerate that with `pnpm sanity:seed:build --strings`)

The build refuses text containing U+FFFD ("�", a mangled character), which `sanity datasets import` rejects and machine translation occasionally produces.

**The case study translations are machine drafts** and need review by native speakers before they are relied on. French and Swahili were checked and corrected by hand. Urdu and Punjabi were fixed where the script was broken. The rest (Luganda, Kinyarwanda, Amharic, Kikuyu, Sukuma, Luo, Oromo, Dinka) are unreviewed; low-resource languages such as Sukuma, Luo and Dinka are the most likely to be wrong. They exist to show the multilingual pages working end to end. The same caveat applies to the seed's placeholder stories themselves, which came from the Figma.

After the first import, **the Studio is the source of truth**. `pnpm sanity:setup` only seeds an empty dataset, but `pnpm sanity:seed` replaces the seed documents (same IDs) and discards edits made to them in the Studio: use it only to reset.

## Adding content types

1. Add the schema in `src/sanity/schemaTypes/` and export it from its `index.ts`. Use `internationalizedArrayString` / `internationalizedArrayText` for translatable text with `validation: requireBaseLanguage`; for a new translatable rich-text or object type, add its name to `fieldTypes` in `sanity.config.ts` (the plugin generates `internationalizedArray<Name>`).
2. Add the document type to `languageFilter.documentTypes` in `sanity.config.ts`.
3. Add a query to `src/lib/sanity/queries.ts` using `localized()` for every translatable field, its result type to `types.ts`, a fetcher to `content.ts`, and a case to `queries.test.ts` that runs it against the seed.
4. Read it from a server component and pass plain data down to client components.
5. Add the type to the webhook's filter.

Files under `src/sanity/` and `sanity.config.ts` are also loaded by the Sanity CLI, which doesn't know the `@/` alias: import between them with relative paths.

## Commands (from `frontend/`)

| Command | |
|---|---|
| `pnpm sanity:setup` | One-time setup (above) |
| `pnpm sanity:validate` | Check the schema |
| `pnpm sanity:seed:build` | Regenerate `sanity/seed/seed.ndjson` |
| `pnpm sanity:seed` | Reset: re-import the seed, **replacing** the seed documents and any Studio edits to them |
