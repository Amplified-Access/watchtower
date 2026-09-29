import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Footer from "@/components/layout/footer/page";
import LegalDocument from "@/features/legal/components/legal-document";
import { getLegalPage } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// The header and text of the code of conduct are the `codeOfConduct` document in Sanity.

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage("codeOfConduct", await getLocale());
  return page ? { title: page.seo.title || page.hero.title, description: page.seo.description } : {};
}

export default async function CodeOfConductPage() {
  const locale = await getLocale();
  const page = await getLegalPage("codeOfConduct", locale);

  return (
    <>
      <LegalDocument page={page} locale={locale} />
      <Footer />
      <SanityLive />
    </>
  );
}
