import type { Metadata } from "next";
import { JsonLd } from "@/components/common/json-ld";
import AlertsPage from "@/components/alerts/alerts-page";
import { codePageJsonLd, codePageMetadata } from "@/lib/seo/page";

// The page is a client component; its search text is "alerts" in the Studio's
// "Search and sharing" document (lib/seo).
export const generateMetadata = (): Promise<Metadata> => codePageMetadata("alerts", "/alerts");

const Page = async () => (
  <>
    <JsonLd data={await codePageJsonLd("alerts", "/alerts")} />
    <AlertsPage />
  </>
);

export default Page;
