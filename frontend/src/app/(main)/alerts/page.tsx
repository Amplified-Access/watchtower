"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import AlertSubscriptionForm from "@/components/alerts/alert-subscription-form";
import Footer from "@/components/layout/footer/page";

const AlertsPage = () => {
  const t = useTranslations("Alerts");
  const tBanner = useTranslations("AnnouncementBanner");

  return (
    <>
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-8 pt-40 pb-20 md:px-16 md:pt-44 md:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-title text-4xl font-semibold leading-tight text-dark">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-dark/60 leading-snug">
              {t("subheading")}
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl md:mt-16">
            <AlertSubscriptionForm />
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

export default AlertsPage;
