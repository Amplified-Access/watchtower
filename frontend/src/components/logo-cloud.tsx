"use client";

import Image from "next/image";
import Container from "./common/container";
import H4 from "./common/heading-four";
import { InfiniteSlider } from "./ui/infinite-slider";
import { ProgressiveBlur } from "./ui/progressive-blur";
import { useTranslations } from "next-intl";

export default function LogoCloud() {
  const t = useTranslations("LogoCloud");

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
              {t("heading")}
            </H4>
          </div>
          <div className="relative py-6 max-w-4xl mx-auto w-full">
            <InfiniteSlider speedOnHover={20} speed={40} gap={0}>
              {[
                {
                  src: "/partners/acwj.png",
                  alt: "ACWJ Logo",
                  className: "mx-auto h-5 grayscale w-fit dark:invert",
                },
                // {
                //   src: "/partners/engineers-without-borders.png",
                //   alt: "Engineers Without Borders Logo",
                //   className: "mx-auto h-10 grayscale w-fit dark:invert",
                // },
                {
                  src: "/partners/misr.png",
                  alt: "Misr Logo",
                  className: "mx-auto h-10 grayscale w-fit dark:invert",
                },
                {
                  src: "/partners/circular-design-hub.png",
                  alt: "Circular Design Hub Logo",
                  className: "mx-auto h-10 grayscale w-fit dark:invert",
                },
                {
                  src: "/partners/cghrds.png",
                  alt: "CGHRDS logo",
                  className: "mx-auto h-10 grayscale w-fit dark:invert",
                },
                // {
                //   src: "/partners/ucc.png",
                //   alt: "UCC Logo",
                //   className: "mx-auto h-10 grayscale w-fit dark:invert",
                // },
                // {
                //   src: "/partners/peace-first.png",
                //   alt: "Peace First Logo",
                //   className: "mx-auto h-10 w-fit dark:invert grayscale",
                // },
              ].map((logo, idx) => (
                <div
                  className="flex items-center w-fit mr-8 md:mr-24"
                  key={logo.src}
                >
                  <Image
                    className={
                      logo.className + " object-contain w-min max-w-40"
                    }
                    src={logo.src}
                    alt={logo.alt}
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
