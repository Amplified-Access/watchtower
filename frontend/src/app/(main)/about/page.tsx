import { getLocale } from "next-intl/server";
import AboutPage from "@/features/about/components/about-page";
import { getAboutPage } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// The about page's text is the `aboutPage` document in Sanity, plus the
// sections it shares with the home page, fetched here and passed to the
// (client) page.
const Page = async () => {
  const content = await getAboutPage(await getLocale());
  return (
    <>
      <AboutPage content={content} />
      <SanityLive />
    </>
  );
};

export default Page;
