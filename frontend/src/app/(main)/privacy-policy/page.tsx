"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Footer from "@/components/layout/footer/page";
import PolicySections from "@/features/legal/components/policy-sections";
import PolicyToc from "@/features/legal/components/policy-toc";
import {
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
} from "@/features/legal/content/privacy-policy";

const TOC_ITEMS = PRIVACY_POLICY_SECTIONS.map(({ id, title }) => ({ id, title }));

const Page = () => {
  const t = useTranslations("PrivacyPolicyPage");
  const tBanner = useTranslations("AnnouncementBanner");
  const locale = useLocale();

  const lastUpdated = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(PRIVACY_POLICY_LAST_UPDATED));

  return (
    <>
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>

        <div className="border-b border-border">
          <div className="mx-auto max-w-3xl px-8 pt-40 pb-16 text-center md:pt-44 md:pb-20">
            <p className="mb-4 font-title text-sm font-medium uppercase tracking-wide text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="font-title text-4xl font-medium leading-tight text-dark md:text-6xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-dark leading-snug md:text-lg">{t("intro")}</p>
            <p className="mt-10 font-title font-semibold text-dark md:text-lg">
              {t("lastUpdated", { date: lastUpdated })}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-360 px-4 md:px-8 lg:grid-cols-[18rem_1fr] xl:grid-cols-[20rem_1fr] xl:px-16">
          <aside className="border-b border-border lg:border-r lg:border-b-0">
            <div className="lg:sticky lg:top-32">
              <PolicyToc label={t("inThisPolicy")} items={TOC_ITEMS} />
            </div>
          </aside>
          <div className="px-6 py-12 md:px-12 md:py-16 xl:px-24">
            <div className="max-w-3xl">
              <PolicySections sections={PRIVACY_POLICY_SECTIONS} />
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

export default Page;
