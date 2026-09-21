"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Footer from "@/components/layout/footer/page";
import MapsHero from "@/features/maps/components/maps-landing/maps-hero";
import DynamicThematicMaps from "@/features/maps/components/dynamic-thematic-maps";

const Page = () => {
  const t = useTranslations("MapsPage");
  const tBanner = useTranslations("AnnouncementBanner");

  return (
    <>
      <MapsHero />

      <DynamicThematicMaps />

      {/* Dig deeper */}
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
          className="pointer-events-none absolute -bottom-24 left-0 -z-10 h-auto w-full invert"
        />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <h2 className="font-title text-3xl font-semibold leading-tight text-dark md:text-4xl">
            {t("digDeeperTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-dark/60 leading-snug">
            {t("digDeeperDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/chat"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "font-title font-medium",
              )}
            >
              {t("chatWithEsi")}
              <ChevronRight />
            </Link>
            <Link
              href="/maps/live-incident-map"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "bg-dark font-title font-medium text-white hover:bg-dark/90",
              )}
            >
              {t("viewLiveMap")}
              <ChevronRight />
            </Link>
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
