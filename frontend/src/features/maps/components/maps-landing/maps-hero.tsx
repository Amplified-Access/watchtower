"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import LivePreviewSection from "@/features/home/components/live-preview-section";
import BrowserFrame from "./browser-frame";

const LIVE_MAP_HREF = "/maps/live-incident-map";

// Tilted "homepage" windows peeking out behind the main frame. Decorative only.
const TiltedPageCard = ({ className }: { className?: string }) => {
  const tHome = useTranslations("Home");

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute hidden w-80 lg:block",
        className,
      )}
    >
      <BrowserFrame
        className="rounded-xl pb-3"
        contentClassName="rounded-sm"
        urlClassName="w-3/5 text-[11px] md:text-[11px]"
      >
        <div className="flex h-72 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-title text-2xl font-semibold leading-tight text-dark">
            <span className="block">{tHome("heroTitleLine1")}</span>
            <span className="block">{tHome("heroTitleLine2")}</span>
          </p>
          <p className="line-clamp-3 text-xs text-dark/60">
            {tHome("heroDescription")}
          </p>
          <span className="bg-dark px-4 py-2 font-title text-xs text-white">
            {tHome("startReporting")}
          </span>
        </div>
      </BrowserFrame>
    </div>
  );
};

const MapsHero = () => {
  const t = useTranslations("MapsPage");
  const tHome = useTranslations("Home");

  return (
    // Gradient and pattern stay full-bleed. The frame container is narrower than
    // the gutters so the tilted cards, which hang off its sides, land inside the
    // viewport instead of being sliced by the section's overflow-hidden.
    <section className="relative isolate overflow-hidden bg-white [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary via-primary/80 to-primary/40" />
      <Image
        src="/brand/Pattern.svg"
        alt=""
        width={1378}
        height={617}
        className="pointer-events-none absolute top-64 -left-1/4 -z-10 h-auto w-full scale-150 invert"
      />
      <Image
        src="/brand/Pattern.svg"
        alt=""
        width={1378}
        height={617}
        className="pointer-events-none absolute top-96 -right-1/3 -z-10 h-auto w-full rotate-180 scale-150 invert"
      />
      <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
        <div className="relative">

          <div className="px-6 pt-32 pb-12 text-center md:pb-16">
            <p className="mb-4 font-title text-xs font-semibold uppercase tracking-widest text-white/80">
              {t("eyebrow")}
            </p>
            <h1 className="mx-auto max-w-2xl font-title text-4xl font-semibold leading-tight text-white md:text-[2.5rem]">
              <span className="block">{t("heroTitleLine1")}</span>
              <span className="block">{t("heroTitleLine2")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-white/90 leading-snug">
              {t("heroDescription")}
            </p>
            <Link
              href={LIVE_MAP_HREF}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-8 bg-white font-title font-medium hover:bg-white/90",
              )}
            >
              {t("exploreLiveMap")}
              <ChevronRight />
            </Link>
          </div>

          <div className="relative mx-auto max-w-4xl px-4 md:px-10">
            <TiltedPageCard className="-left-40 top-28 -rotate-12" />
            <TiltedPageCard className="-right-28 top-36 rotate-28" />

            <BrowserFrame className="relative">
              <div className="px-6 py-10 text-center md:py-12">
                <p className="mb-3 font-title text-sm font-medium uppercase tracking-wide text-primary">
                  {tHome("exploreLabel")}
                </p>
                <p className="mx-auto max-w-md text-sm text-dark/60 md:text-base">
                  {tHome("exploreDescription")}
                </p>
                <h2 className="mx-auto mt-4 max-w-md font-title text-2xl font-semibold leading-tight text-dark md:text-4xl">
                  {tHome("exploreHeading")}
                </h2>
              </div>

              {/* The real live preview (live data) as a clipped teaser. It's
                  inert so the clipped controls can't be half-used; an overlay
                  link sends clicks to the full live map instead. The link is a
                  sibling, not a wrapper, because the preview has its own links. */}
              <div className="group relative h-72 overflow-hidden bg-dark md:h-80">
                {/* Two things, and they have to stay together. The zoom cancels
                    the section's: Mapbox sizes its canvas from getBoundingClientRect
                    and renders nothing at all inside a zoomed ancestor. The pinned
                    variable stops the preview's own cards re-applying
                    [zoom:var(--viewport-scale)] on top of that, which is what left
                    them at 1.48x while the globe beneath them sat at 1x. Both set,
                    the whole preview lands at 1x and the cards match the map. */}
                <div
                  inert
                  className="pointer-events-none [zoom:calc(1/var(--viewport-scale))]"
                >
                  {/* Separate element: declaring the variable on the element that
                      also reads it would resolve the calc against 1 and cancel
                      nothing. */}
                  <div className="[--viewport-scale:1]">
                    <LivePreviewSection />
                  </div>
                </div>
                <Link
                  href={LIVE_MAP_HREF}
                  aria-label={t("openLiveMap")}
                  className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-black/60 via-transparent to-transparent pb-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 font-title text-sm font-medium text-dark">
                    {t("exploreLiveMap")}
                    <ChevronRight className="size-4" />
                  </span>
                </Link>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapsHero;
