import { getLocale } from "next-intl/server";
import HomePage from "@/features/home/components/home-page";
import { getHomePage } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// The home page's text is the `homePage` document in Sanity, fetched here and
// passed to the (client) page.
const Page = async () => {
  const content = await getHomePage(await getLocale());
  return (
    <>
      <HomePage content={content} />
      <SanityLive />
    </>
  );
};

export default Page;
