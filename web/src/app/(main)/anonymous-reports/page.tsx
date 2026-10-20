import type { Metadata } from "next";
import { JsonLd } from "@/components/common/json-ld";
import AnonymousReportPage from "@/features/anonymous-reporting/components/anonymous-report-page";
import { codePageJsonLd, codePageMetadata } from "@/lib/seo/page";

// The page is a client component; its search text is "report" in the Studio's
// "Search and sharing" document (lib/seo).
export const generateMetadata = (): Promise<Metadata> => codePageMetadata("report", "/anonymous-reports");

const Page = async () => (
  <>
    <JsonLd data={await codePageJsonLd("report", "/anonymous-reports")} />
    <AnonymousReportPage />
  </>
);

export default Page;
