import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { JsonLd } from "@/components/common/json-ld";
import Footer from "@/components/layout/footer/page";
import LegalDocument from "@/features/legal/components/legal-document";
import { getLegalPage } from "@/lib/sanity/content";
import { DEFAULT_CODE_OF_CONDUCT_SEO } from "@/lib/seo/defaults";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalPageSeo, pageJsonLd } from "@/lib/seo/page";

// The header and text of the code of conduct are the `codeOfConduct` document in Sanity.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = await legalPageSeo(await getLegalPage("codeOfConduct", locale), locale, DEFAULT_CODE_OF_CONDUCT_SEO);
  return pageMetadata({ ...seo, path: "/code-of-conduct", locale });
}

export default async function CodeOfConductPage() {
  const locale = await getLocale();
  const page = await getLegalPage("codeOfConduct", locale);
  const seo = await legalPageSeo(page, locale, DEFAULT_CODE_OF_CONDUCT_SEO);
  const jsonLd = await pageJsonLd({
    path: "/code-of-conduct",
    name: seo.title,
    description: seo.description,
    image: seo.image,
    dateModified: page?.updatedAt,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <LegalDocument page={page} locale={locale} />
      <Footer />
    </>
  );
}
