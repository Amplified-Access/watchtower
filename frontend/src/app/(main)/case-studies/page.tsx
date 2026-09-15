"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/footer/page";
import CaseStudiesList from "@/features/case-studies/components/case-studies-list";

const Page = () => {
  const t = useTranslations("CaseStudiesPage");
  const tBanner = useTranslations("AnnouncementBanner");

  return (
    <>
      {/* Full-bleed grid hero with no gutter lines, matching the maps hero.
          Starts under the fixed header; the top padding clears header + banner. */}
      <section className="relative isolate border-b border-border bg-[#f4f4f4] [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(0_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.06)_1px,transparent_1px)] bg-size-[46px_46px]" />
        <div className="mx-auto max-w-4xl px-6 pt-40 pb-16 text-center md:pt-48 md:pb-20">
          <p className="mb-4 font-title text-sm font-medium uppercase tracking-wide text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="font-title text-4xl font-semibold leading-tight text-dark md:text-5xl">
            <span className="block">{t("heroTitleLine1")}</span>
            <span className="block">{t("heroTitleLine2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-dark leading-snug">
            {t("heroDescription")}
          </p>
        </div>
      </section>

      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-8 py-12 md:px-16 md:py-16 xl:px-28">
          <Suspense>
            <CaseStudiesList />
          </Suspense>
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
