import type { Metadata } from "next";
import { codePageMetadata } from "@/lib/seo/page";
import { GeneralSignInForm } from "@/features/auth/components/general-sign-in-form";

export const generateMetadata = (): Promise<Metadata> => codePageMetadata("signIn", "/sign-in");

const Page = () => {
  return <GeneralSignInForm />;
};

export default Page;
