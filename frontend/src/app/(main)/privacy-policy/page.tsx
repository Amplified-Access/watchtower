import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import DatedPolicyPage, { datedPolicyMetadata } from "@/features/legal/components/dated-policy-page";
import { DEFAULT_PRIVACY_SEO } from "@/lib/seo/defaults";

// The `privacyPolicy` document in Sanity, laid out like the terms of use.
const POLICY = { id: "privacyPolicy", path: "/privacy-policy", fallbackSeo: DEFAULT_PRIVACY_SEO };

export async function generateMetadata(): Promise<Metadata> {
  return datedPolicyMetadata(POLICY, await getLocale());
}

const Page = async () => <DatedPolicyPage {...POLICY} locale={await getLocale()} />;

export default Page;
