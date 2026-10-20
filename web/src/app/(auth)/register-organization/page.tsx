import type { Metadata } from "next";
import { JsonLd } from "@/components/common/json-ld";
import { codePageJsonLd, codePageMetadata } from "@/lib/seo/page";
import OrganizationRegistrationForm from "@/features/organization-registration/components/organization-registration-form";

export const generateMetadata = (): Promise<Metadata> =>
  codePageMetadata("registerOrganization", "/register-organization");

const Page = async () => (
  <>
    <JsonLd data={await codePageJsonLd("registerOrganization", "/register-organization")} />
    <OrganizationRegistrationForm />
  </>
);

export default Page;
