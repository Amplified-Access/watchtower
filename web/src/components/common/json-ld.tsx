/**
 * Renders structured data (src/lib/seo/structured-data.ts) as a
 * `<script type="application/ld+json">`. `<` is escaped so text from Sanity
 * can't close the script tag early (Next.js's JSON-LD guidance). A plain
 * <script>, not next/script: JSON-LD is data, not code to run.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
