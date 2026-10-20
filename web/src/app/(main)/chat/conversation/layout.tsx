import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { fullTitle } from "@/lib/seo/metadata";
import { getCodePageSeo } from "@/lib/seo/page";

// A conversation is one reader's questions (the first is in the address), so
// it is kept out of search results. The chat's own page is /chat; the tab
// carries its title.
export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getCodePageSeo("chat", await getLocale());
  return { title: { absolute: fullTitle(title) }, robots: { index: false, follow: true } };
}

const ConversationLayout = ({ children }: { children: React.ReactNode }) => children;

export default ConversationLayout;
