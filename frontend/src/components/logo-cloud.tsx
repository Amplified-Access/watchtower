"use client";

import Container from "./common/container";
import H4 from "./common/heading-four";
import SanityImage from "./common/sanity-image";
import { InfiniteSlider } from "./ui/infinite-slider";
import { ProgressiveBlur } from "./ui/progressive-blur";
import { cn } from "@/lib/utils";
import type { PartnerLogo } from "@/lib/sanity/types";

// The home page's scrolling row of partner logos, edited in Sanity (Home page
// → Partners). Hidden while it has none.
export default function LogoCloud({ heading, logos }: { heading: string; logos: PartnerLogo[] }) {
  if (logos.length === 0) return null;

  return (
    // The preceding section ends with its own 64px white strip (pb-16), so this
    // one adds no top padding — that keeps the row optically centred in the gap.
    <section className="relative bg-white overflow-hidden pb-16 [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
        <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
        <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
      </div>
      <Container size="lg" className="group relative px-8 md:px-12 xl:px-20">
        <div className="flex flex-col items-center md:flex-row">
          <div className="md:max-w-44 shrink-0 md:border-r md:pr-6">
            <H4 className="text-3xl md:text-lg text-center md:text-left py-6">
              {heading}
            </H4>
          </div>
          <div className="relative py-6 max-w-4xl mx-auto w-full">
            <InfiniteSlider speedOnHover={20} speed={40} gap={0}>
              {logos.map(({ _key, name, size, logo }) => (
                <div className="flex items-center w-fit mr-8 md:mr-24" key={_key}>
                  {/* No blur placeholder: on a transparent logo it shows as a
                      grey box until the image loads. */}
                  <SanityImage
                    className={cn(
                      "mx-auto grayscale w-fit dark:invert object-contain w-min max-w-40",
                      size === "small" ? "h-5" : "h-10",
                    )}
                    image={{ ...logo, alt: name, lqip: null }}
                    height="20"
                    width={400}
                  />
                </div>
              ))}
            </InfiniteSlider>

            <div className="hidden md:block bg-linear-to-r from-white absolute inset-y-0 left-0 w-4 md:w-20"></div>
            <div className="hidden md:block bg-linear-to-l from-white absolute inset-y-0 right-0 w-4 md:w-20"></div>
            <ProgressiveBlur
              className="hidden md:block pointer-events-none absolute border-red-500 left-0 top-0 h-full w-20"
              direction="left"
              blurIntensity={1}
            />
            <ProgressiveBlur
              className="hidden md:block pointer-events-none absolute right-0 top-0 h-full w-20 "
              direction="right"
              blurIntensity={1}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
