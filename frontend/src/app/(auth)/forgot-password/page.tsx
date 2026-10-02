import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GeneralForgotPasswordForm } from "@/features/auth/components/general-forgot-password-form";

// A step in signing in, not a page to find in search: kept out of results.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("forgotPassword").replace(/\?$/, ""), robots: { index: false, follow: false } };
}

const Page = () => {
  return <GeneralForgotPasswordForm />;
};

export default Page;
