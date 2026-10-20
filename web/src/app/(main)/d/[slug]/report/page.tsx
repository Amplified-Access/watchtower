import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import AnonymousReportPage from "@/features/anonymous-reporting/components/anonymous-report-page";
import { getPublicDeployment } from "@/features/deployments/get-public-deployment";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteShareImage } from "@/lib/seo/page";

type Props = { params: Promise<{ slug: string }> };

// A deployment's reporting link: the public report form, sent to it.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deployment = await getPublicDeployment((await params).slug);
  if (!deployment) return {};
  const locale = await getLocale();
  const t = await getTranslations("AnonymousReporting");
  return pageMetadata({
    path: `/d/${deployment.slug}/report`,
    title: `${t("pageTitle")}: ${deployment.name}`,
    description: deployment.description || deployment.name,
    locale,
    image: await siteShareImage(locale),
  });
}

const DeploymentReportPage = async ({ params }: Props) => {
  const deployment = await getPublicDeployment((await params).slug);
  if (!deployment) notFound();
  return <AnonymousReportPage deployment={deployment} />;
};

export default DeploymentReportPage;
