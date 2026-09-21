"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/footer/page";
import CaseStudiesList from "@/features/case-studies/components/case-studies-list";
import FeaturedCaseStudies from "@/features/case-studies/components/featured-case-studies";

const Page = () => {
  const t = useTranslations("CaseStudiesPage");
  const tBanner = useTranslations("AnnouncementBanner");

  return (
    <>
      {/* Starts under the fixed header; the top padding clears header + banner. */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        {/* The grid panel stops at the same gutters the next section runs its
            rails down, rather than bleeding to the viewport edge. */}
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="relative isolate overflow-hidden border-b border-border bg-[#f4f4f4]">
            {/* Radial mask so the grid reads through the middle and falls away
                at the edges instead of tiling flat across the whole panel. */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(0_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.06)_1px,transparent_1px)] bg-size-[46px_46px] mask-[radial-gradient(ellipse_at_center,black_10%,transparent_75%)]" />
            <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 text-center md:pt-36 md:pb-20">
              <h1 className="font-title text-4xl font-semibold leading-tight text-dark">
                {t("eyebrow")}
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-dark leading-snug">
                {t("heroDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-8 py-12 md:px-16 md:py-16 xl:px-28">
          <FeaturedCaseStudies />
          <div className="pt-16 md:pt-24">
            <Suspense>
              <CaseStudiesList />
            </Suspense>
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
