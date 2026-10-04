import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { JsonLd } from "@/components/common/json-ld";
import AboutPage from "@/features/about/components/about-page";
import { getAboutPage } from "@/lib/sanity/content";
import { DEFAULT_ABOUT_SEO } from "@/lib/seo/defaults";
import { ownTitle, pageMetadata } from "@/lib/seo/metadata";
import { firstShareImage, pageJsonLd, siteShareImage } from "@/lib/seo/page";

// The about page's text is the `aboutPage` document in Sanity, plus the
// sections it shares with the home page, fetched here and passed to the
// (client) page. Its search title and description are that document's
// "Search and sharing" fields.
const aboutSeo = async (locale: string) => {
  const content = await getAboutPage(locale);
  return {
    content,
    title: ownTitle(content.seo.title) || DEFAULT_ABOUT_SEO.title,
    description: content.seo.description || DEFAULT_ABOUT_SEO.description,
    image: firstShareImage(content.seo.image) ?? (await siteShareImage(locale)),
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { title, description, image } = await aboutSeo(locale);
  return pageMetadata({ path: "/about", title, description, image, locale });
}

const Page = async () => {
  const locale = await getLocale();
  const { content, title, description, image } = await aboutSeo(locale);
  const jsonLd = await pageJsonLd({
    path: "/about",
    type: "AboutPage",
    name: title,
    description,
    image,
    faqs: content.safety.items,
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <AboutPage content={content} />
    </>
  );
};

export default Page;
