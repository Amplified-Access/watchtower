import type { Metadata } from "next";
import { JsonLd } from "@/components/common/json-ld";
import MapsPage from "@/features/maps/components/maps-landing/maps-page";
import { codePageJsonLd, codePageMetadata } from "@/lib/seo/page";

// The page is a client component; its search text is "maps" in the Studio's
// "Search and sharing" document (lib/seo).
export const generateMetadata = (): Promise<Metadata> => codePageMetadata("maps", "/maps");

const Page = async () => (
  <>
    <JsonLd data={await codePageJsonLd("maps", "/maps", { type: "CollectionPage" })} />
    <MapsPage />
  </>
);

export default Page;
