"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/footer/page";
import AnonymousIncidentReportForm from "@/features/anonymous-reporting/components/anonymous-incident-report-form";
import type { Deployment } from "@/lib/api/deployments";

// The public report form. Given a deployment, it is that deployment's
// reporting link: named under the title, limited to its incident types, and
// sent to it; when the deployment isn't taking reports, the form gives way
// to a note and a link to its map.
const AnonymousReportPage = ({ deployment }: { deployment?: Deployment }) => {
  const t = useTranslations("AnonymousReporting");
  const tBanner = useTranslations("AnnouncementBanner");
  const tDeployment = useTranslations("DeploymentPage");

  return (
    <>
      <section className="relative isolate overflow-hidden bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-auto w-full max-w-360 -translate-x-1/2 invert"
        />
        <div className="mx-auto max-w-360 px-8 pt-40 pb-24 md:px-16 md:pt-44 md:pb-40">
          <div className="mx-auto max-w-xl">
            <h1 className="text-center font-title text-4xl font-semibold leading-tight text-dark">
              {t("pageTitle")}
            </h1>
            {deployment && (
              <div className="mt-3 text-center">
                <Link
                  href={`/d/${deployment.slug}`}
                  className="font-title text-lg font-medium text-primary hover:underline"
                >
                  {deployment.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {tDeployment("byOrganization", { organization: deployment.organizationName ?? "" })}
                </p>
              </div>
            )}
            <div className="mt-8 md:mt-10">
              {deployment && !deployment.acceptingReports ? (
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground">{tDeployment("notTakingReports")}</p>
                  <Link
                    href={`/d/${deployment.slug}`}
                    className="inline-block rounded-full border border-border px-4 py-2 font-title text-sm font-medium text-dark hover:bg-dark/5"
                  >
                    {tDeployment("viewMap")}
                  </Link>
                </div>
              ) : (
                <AnonymousIncidentReportForm deployment={deployment} />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate bg-primary py-4 text-white [zoom:var(--viewport-scale)]">
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-center text-sm font-medium md:px-8 xl:px-16">
          <span>{tBanner("message")}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {tBanner("cta")}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AnonymousReportPage;
