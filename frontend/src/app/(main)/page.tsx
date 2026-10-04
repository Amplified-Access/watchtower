import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { JsonLd } from "@/components/common/json-ld";
import HomePage from "@/features/home/components/home-page";
import { getHomePage, getSeoSettings } from "@/lib/sanity/content";
import { DEFAULT_HOME_SEO } from "@/lib/seo/defaults";
import { ownTitle, pageMetadata } from "@/lib/seo/metadata";
import { firstShareImage } from "@/lib/seo/page";
import { SITE } from "@/lib/seo/site";
import { homeGraph } from "@/lib/seo/structured-data";

// The home page's text is the `homePage` document in Sanity, fetched here and
// passed to the (client) page. Its search title and description are that
// document's "Search and sharing" fields.
const homeSeo = async (locale: string) => {
  const [content, settings] = await Promise.all([getHomePage(locale), getSeoSettings(locale)]);
  return {
    content,
    siteDescription: settings.description || SITE.description,
    title: ownTitle(content.seo.title) || DEFAULT_HOME_SEO.title,
    description: content.seo.description || settings.description || DEFAULT_HOME_SEO.description,
    image: firstShareImage(content.seo.image, settings.image),
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { title, description, image } = await homeSeo(locale);
  return pageMetadata({ path: "/", title, description, image, locale, home: true });
}

const Page = async () => {
  const locale = await getLocale();
  const { content, siteDescription, title, description, image } = await homeSeo(locale);
  return (
    <>
      <JsonLd data={homeGraph({ name: title, description, siteDescription, image, locale, faqs: content.faqs.items })} />
      <HomePage content={content} />
    </>
  );
};

export default Page;
