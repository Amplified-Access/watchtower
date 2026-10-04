import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { JsonLd } from "@/components/common/json-ld";
import Footer from "@/components/layout/footer/page";
import LegalDocument from "@/features/legal/components/legal-document";
import { getLegalPage } from "@/lib/sanity/content";
import { DEFAULT_SECURITY_SEO } from "@/lib/seo/defaults";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalPageSeo, pageJsonLd } from "@/lib/seo/page";

// The header and text of the security policy are the `security` document in Sanity.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = await legalPageSeo(await getLegalPage("security", locale), locale, DEFAULT_SECURITY_SEO);
  return pageMetadata({ ...seo, path: "/security", locale });
}

export default async function SecurityPage() {
  const locale = await getLocale();
  const page = await getLegalPage("security", locale);
  const seo = await legalPageSeo(page, locale, DEFAULT_SECURITY_SEO);
  const jsonLd = await pageJsonLd({
    path: "/security",
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
