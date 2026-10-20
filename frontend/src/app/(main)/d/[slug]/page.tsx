import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import LiveMap from "@/features/maps/components/live-map";
import { getPublicDeployment } from "@/features/deployments/get-public-deployment";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteShareImage } from "@/lib/seo/page";

type Props = { params: Promise<{ slug: string }> };

// A deployment's public map: the reports sent through its reporting link.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deployment = await getPublicDeployment((await params).slug);
  if (!deployment) return {};
  const locale = await getLocale();
  return pageMetadata({
    path: `/d/${deployment.slug}`,
    title: deployment.name,
    description:
      deployment.description ||
      [deployment.organizationName, deployment.region, deployment.country].filter(Boolean).join(", "),
    locale,
    image: await siteShareImage(locale),
  });
}

const DeploymentMapPage = async ({ params }: Props) => {
  const deployment = await getPublicDeployment((await params).slug);
  if (!deployment) notFound();
  return <LiveMap deployment={deployment} />;
};

export default DeploymentMapPage;
