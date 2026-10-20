import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { JsonLd } from "@/components/common/json-ld";
import LiveMap from "@/features/maps/components/live-map";
import { codePageJsonLd, codePageMetadata, getCodePageSeo } from "@/lib/seo/page";

// One canonical address, whatever the map is filtered to.
export const generateMetadata = (): Promise<Metadata> => codePageMetadata("liveMap", "/maps/live-incident-map");

const Page = async () => {
  const maps = await getCodePageSeo("maps", await getLocale());
  const jsonLd = await codePageJsonLd("liveMap", "/maps/live-incident-map", {
    parents: [{ name: maps.title, path: "/maps" }],
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <LiveMap />
    </>
  );
};

export default Page;
