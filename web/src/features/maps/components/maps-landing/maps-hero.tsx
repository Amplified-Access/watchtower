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

// Empty windows peeking out from behind the main frame, one each side. They
// run nearly its full height and show only a narrow strip, so they read as
// depth rather than content. Kept unrotated for a more professional feel.
// Decorative only.
const SidePageCard = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("pointer-events-none absolute hidden w-80 lg:block", className)}
  >
    <BrowserFrame bare className="flex h-full flex-col" contentClassName="flex-1">
      {null}
    </BrowserFrame>
  </div>
);

const MapsHero = () => {
  const t = useTranslations("MapsPage");

  return (
    // The gradient and pattern sit inside the page container, so the hero's
    // edges line up with the header and the guide lines of the sections below.
    // The side windows sit inside that box, so its overflow-hidden never
    // slices them.
    <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
      <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
        <div className="relative isolate overflow-hidden">
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

          <div className="px-6 pt-32 pb-12 text-center md:pb-16">
            <h1 className="mx-auto max-w-2xl font-title text-4xl font-semibold leading-tight text-white md:text-[2.5rem]">
              {t("eyebrow")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-white/90 leading-snug">
              {t("heroDescription")}
            </p>
            {/* commented out while trying the hero without it: the live map
                preview below already links there on hover */}
            {/* <Link
              href={LIVE_MAP_HREF}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-8 bg-white font-title font-medium hover:bg-white/90",
              )}
            >
              {t("exploreLiveMap")}
              <ChevronRight />
            </Link> */}
          </div>

          {/* The side windows sit where they always have, near the box edges
              (8px in at lg, 32px from xl, where the zoom keeps it fixed). The
              main frame is padded just past them (40px, then 72px), so it
              spans nearly the whole box and covers all but a 32-40px strip of
              each. top-10 drops them just below the main frame's top edge and
              bottom-0 runs them to the hero's bottom, where the section clips
              them along with it. */}
          <div className="relative px-4 md:px-10 xl:px-18">
            <SidePageCard className="top-10 bottom-0 left-2 xl:left-8" />
            <SidePageCard className="top-10 bottom-0 right-2 xl:right-8" />

            <BrowserFrame className="relative">
              <div className="px-6 py-10 text-center md:py-12">
                <h2 className="mx-auto mt-4 max-w-md font-title text-2xl font-semibold leading-tight text-dark md:text-4xl">
                  {t("liveMapTitle")}
                </h2>
                <p className="mt-4 mx-auto max-w-md text-sm text-dark/60 md:text-base">
                  {t("liveMapDescription")}
                </p>
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
