import type { Metadata } from "next";
import { JsonLd } from "@/components/common/json-ld";
import ChatStartPage from "@/features/chat/components/chat-start-page";
import { codePageJsonLd, codePageMetadata } from "@/lib/seo/page";

// The page is a client component; its search text is "chat" in the Studio's
// "Search and sharing" document (lib/seo).
export const generateMetadata = (): Promise<Metadata> => codePageMetadata("chat", "/chat");

const Page = async () => (
  <>
    <JsonLd data={await codePageJsonLd("chat", "/chat")} />
    <ChatStartPage />
  </>
);

export default Page;
