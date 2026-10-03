"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Footer from "@/components/layout/footer/page";
import HeadingTwo from "@/components/common/heading-two";
import LanguageMarquee from "@/components/common/language-marquee";
import LineBreaks from "@/components/common/line-breaks";
import TextComponent from "@/components/common/text-component";
import LoopingVideo from "@/components/common/looping-video";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AboutPageContent } from "@/lib/sanity/types";

// The about page. Its text comes from the `aboutPage` document in Sanity, and
// the figures and the bottom banner from `homePage` (see
// app/(main)/about/page.tsx). The language names in the marquee are UI copy in
// messages/*.json. Layout and videos are code. Like the rest of the site, each
// section has one heading and no label above it.

type Video = { src: string; poster: string; width: number; height: number };

const video = (name: string, width: number, height: number): Video => ({
  src: `/videos/${name}.mp4`,
  poster: `/videos/${name}-poster.webp`,
  width,
  height,
});

// Each step shows its clip in front, with a second card offset behind (or, for
// the report, in front): the report's evidence and submit clip, or a still from
// later in the same clip (the globe, the featured case studies). In this order: reporting, the maps, case studies. A step
// added in Sanity beyond these has no media.
const STEP_MEDIA: { main: Video; second: Video | string; secondInFront?: boolean }[] = [
  { main: video("report", 1080, 1200), second: video("report-evidence", 1080, 800), secondInFront: true },
  { main: video("maps", 1600, 900), second: "/videos/maps-still.webp" },
  { main: video("case-studies", 1600, 900), second: "/videos/case-studies-still.webp" },
];

// The fine grain over the blue sections, drawn by the browser rather than
// shipped as an image.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Grain = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10 opacity-25 mix-blend-soft-light"
    style={{ backgroundImage: GRAIN }}
  />
);

/** The two vertical guide lines the site's sections share. */
const Rails = ({ className }: { className?: string }) => (
  <div className={cn("pointer-events-none absolute inset-0 mx-auto max-w-360", className)}>
    <div className="absolute inset-y-0 left-4 w-px bg-current md:left-8 xl:left-16" />
    <div className="absolute inset-y-0 right-4 w-px bg-current md:right-8 xl:right-16" />
  </div>
);

const card = "overflow-hidden rounded-lg border border-border bg-white shadow-[0_12px_40px_rgb(0_0_0/0.06)]";

/** A step's clip, with its second card beside it on wider screens, fading out at the bottom. */
const StepMedia = ({ main, second, secondInFront }: (typeof STEP_MEDIA)[number]) => (
  <div className="relative md:aspect-2/1 md:mask-[linear-gradient(to_bottom,black_65%,transparent)]">
    <div className={cn(card, "relative md:absolute md:top-0 md:left-0", secondInFront ? "md:w-[52%]" : "md:w-[64%]")}>
      <div className={cn(secondInFront ? "aspect-square" : "aspect-video")}>
        <LoopingVideo {...main} className="h-full object-cover object-top" />
      </div>
    </div>
    <div
      className={cn(
        card,
        "absolute top-[8%] right-0 hidden w-[50%] md:block",
        secondInFront ? "z-10" : "-z-10 top-[5%] right-[2%] w-[44%]",
      )}
    >
      <div className="relative aspect-3/2">
        {typeof second === "string" ? (
          <Image src={second} alt="" fill sizes="40vw" className="object-cover object-top-right" />
        ) : (
          <LoopingVideo {...second} className="h-full object-cover object-top" />
        )}
      </div>
    </div>
  </div>
);

const AboutPage = ({ content }: { content: AboutPageContent }) => {
  const { hero, steps, languages: languagesText, audiences, safety, cta, home } = content;
  const t = useTranslations("About");

  const languageNames = [
    t("langEnglish"),
    t("langFrench"),
    t("langSwahili"),
    t("langLuganda"),
    t("langKinyarwanda"),
    t("langAmharic"),
    t("langPunjabi"),
    t("langUrdu"),
    t("langKikuyu"),
    t("langSukuma"),
    t("langLuo"),
    t("langOromo"),
    t("langDinka"),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#1f57ea,#386cec)] [zoom:var(--viewport-scale)]">
        <Grain />
        <Rails className="text-white/80" />
        {/* The fixed navigation bar covers the top of the hero by
            --nav-height (in screen pixels, hence the division by the zoom),
            so that much is added above the same padding as below: the title
            sits centred in the blue that shows. */}
        <div className="mx-auto max-w-4xl px-8 pt-[calc(var(--nav-height)/var(--viewport-scale)+4.5rem)] pb-18 text-center md:pt-[calc(var(--nav-height)/var(--viewport-scale)+6rem)] md:pb-24">
          <h1 className="font-title text-4xl font-semibold leading-tight text-white">
            {hero.title}
          </h1>
        </div>
      </section>

      {/* The languages WatchTower speaks, scrolling */}
      <section className="bg-white">
        <LanguageMarquee names={languageNames} label={languagesText.heading} />
      </section>

      {/* The three steps */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <Rails className="text-border" />
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-8 py-20 md:gap-20 md:px-16 md:py-24">
          {steps.map((step, index) => (
            <div key={step._key}>
              <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 md:items-center md:gap-16">
                <h3 className="font-title text-3xl font-semibold leading-tight text-dark md:text-4xl">
                  <LineBreaks text={step.title} breakClassName="hidden md:inline" />
                </h3>
                <p className="max-w-md leading-relaxed text-dark/60">{step.description}</p>
              </div>
              {STEP_MEDIA[index] && (
                <div className="mt-10 md:mt-12">
                  <StepMedia {...STEP_MEDIA[index]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Languages: brand blue lightening to a pale blue, with every language
          scrolling along the bottom, ending on a hard edge against the white
          section after it. */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-primary)_0%,#95abe5_62%,#dde2f6_100%)] [zoom:var(--viewport-scale)]">
        <Grain />
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute bottom-0 left-0 -z-10 h-auto w-full opacity-50"
        />
        <div className="relative">
          <Rails className="text-white/80" />
          <div className="mx-auto max-w-2xl px-8 py-28 text-center md:py-32">
            <HeadingTwo className="text-white">{languagesText.heading}</HeadingTwo>
            <TextComponent className="mx-auto mt-4 max-w-xl text-white/80">
              {languagesText.description.replace("{count}", String(languageNames.length))}
            </TextComponent>
          </div>
        </div>
        {/* The section is already scaled, so the marquee isn't scaled again. */}
        <LanguageMarquee names={languageNames} label={languagesText.heading} className="border-white/70 bg-white/80 [zoom:1]" />
        <div className="h-14" />
      </section>

      {/* Who it is for */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <Rails className="text-border" />
        <div className="mx-auto max-w-6xl px-8 py-20 md:px-16 md:py-24">
          <HeadingTwo className="leading-tight">
            <LineBreaks text={audiences.heading} breakClassName="hidden md:inline" />
          </HeadingTwo>
          <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-6">
            {audiences.items.map((audience, index) => (
              <div
                key={audience._key}
                // The third card sits centred under the first two.
                className={cn("flex flex-col", index === 2 && "md:col-span-2 md:mx-auto md:w-[calc(50%-0.75rem)]")}
              >
                <p className="mb-3 font-title text-sm font-medium text-primary">{audience.label}</p>
                <div className="flex-1 rounded-xl border border-[#c3d4ff] bg-[#f6f3f8] p-8 shadow-[0_12px_32px_rgb(0_66_231/0.06)] md:p-10">
                  {/* The WatchTower mark, in brand blue. */}
                  <div
                    aria-hidden
                    className="h-6 w-7 bg-primary [mask:url(/brand/icon-black.svg)_center/contain_no-repeat]"
                  />
                  <h3 className="mt-4 font-title text-xl font-semibold leading-snug text-primary">
                    {audience.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-dark/70">{audience.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
            {home.stats.map((stat) => {
              // "2,000+": the plus is set smaller, as in the design.
              const plus = stat.value.endsWith("+");
              return (
                <div
                  key={stat._key}
                  className="flex flex-col items-center justify-center gap-1 border-r border-b border-border py-8 text-center first:border-l md:py-10 nth-3:border-l md:nth-3:border-l-0"
                >
                  <span className="flex items-center font-title text-3xl font-semibold text-dark md:text-4xl">
                    {plus ? stat.value.slice(0, -1) : stat.value}
                    {plus && <span className="ml-0.5 text-xl md:text-2xl">+</span>}
                  </span>
                  <span className="text-sm text-dark/60">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Your safety */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="relative isolate overflow-hidden bg-dark px-6 py-16 md:px-14 md:py-24">
            <Image
              src="/brand/Pattern.svg"
              alt=""
              width={1378}
              height={617}
              className="pointer-events-none absolute -bottom-16 left-0 -z-10 h-auto w-full opacity-10"
            />
            <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
              <div>
                <h2 className="font-title text-3xl font-semibold leading-tight text-white md:text-4xl">
                  <LineBreaks text={safety.title} breakClassName="hidden md:inline" />
                </h2>
                <p className="mt-4 max-w-xs leading-relaxed text-white/60">{safety.description}</p>
              </div>

              <Accordion type="single" collapsible defaultValue={safety.items[0]?._key} className="w-full">
                {safety.items.map(({ _key, question, answer }) => (
                  <AccordionItem
                    key={_key}
                    value={_key}
                    className="relative border-t border-b-0 border-white/20 last:border-b"
                  >
                    <AccordionTrigger className="group py-6 pr-12 pl-6 font-title text-base text-white hover:no-underline [&>svg]:hidden">
                      <span className="flex-1 text-left">{question}</span>
                      {/* The toggle sits on the rule above the question. */}
                      <span className="absolute top-0 right-6 flex size-6 -translate-y-1/2 items-center justify-center bg-primary">
                        <Plus className="size-3.5 text-white group-data-[state=open]:hidden" />
                        <Minus className="hidden size-3.5 text-white group-data-[state=open]:block" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pr-12 pb-6 pl-6 text-base leading-relaxed font-normal text-white/60">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="relative isolate overflow-hidden bg-white [zoom:var(--viewport-scale)]">
        <Rails className="text-border" />
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute -bottom-60 left-0 -z-10 h-auto w-full invert"
        />
        <div className="mx-auto max-w-2xl px-8 pt-20 pb-28 text-center md:pt-24 md:pb-32">
          <HeadingTwo className="text-center">{cta.title}</HeadingTwo>
          <TextComponent className="mx-auto mt-4 max-w-xl text-center">{cta.description}</TextComponent>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/anonymous-reports"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-dark font-title font-medium text-white hover:bg-dark/90",
              )}
            >
              {cta.primaryCta}
              <ChevronRight />
            </Link>
            <Link
              href="/maps/live-incident-map"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "font-title font-medium",
              )}
            >
              {cta.secondaryCta}
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative isolate bg-primary py-4 text-white [zoom:var(--viewport-scale)]">
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-center text-sm font-medium md:px-8 xl:px-16">
          <span>{home.banner.text}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {home.banner.cta}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AboutPage;
