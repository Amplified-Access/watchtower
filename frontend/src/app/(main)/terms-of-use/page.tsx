import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import DatedPolicyPage, { datedPolicyMetadata } from "@/features/legal/components/dated-policy-page";
import { DEFAULT_TERMS_SEO } from "@/lib/seo/defaults";

// The `termsOfUse` document in Sanity, laid out like the privacy policy.
const POLICY = { id: "termsOfUse", path: "/terms-of-use", fallbackSeo: DEFAULT_TERMS_SEO };

export async function generateMetadata(): Promise<Metadata> {
  return datedPolicyMetadata(POLICY, await getLocale());
}

const Page = async () => <DatedPolicyPage {...POLICY} locale={await getLocale()} />;

export default Page;
