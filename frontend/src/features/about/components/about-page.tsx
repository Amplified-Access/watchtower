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
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AboutPageContent } from "@/lib/sanity/types";
import { STEP_GRAPHICS } from "./step-graphics";

// The about page. Its text comes from the `aboutPage` document in Sanity, and
// the figures and the bottom banner from `homePage` (see
// app/(main)/about/page.tsx). The language names in the marquee are UI copy in
// messages/*.json. Layout, the step illustrations (step-graphics.tsx) and
// their numbers ("01.") are code.

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

/** The small label above a heading, as the site sets it ("Step 1" on Home). */
const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary", className)}>
    {children}
  </p>
);

/** The two vertical guide lines the site's sections share. */
const Rails = ({ className }: { className?: string }) => (
  <div className={cn("pointer-events-none absolute inset-0 mx-auto max-w-360", className)}>
    <div className="absolute inset-y-0 left-4 w-px bg-current md:left-8 xl:left-16" />
    <div className="absolute inset-y-0 right-4 w-px bg-current md:right-8 xl:right-16" />
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
      {/* Hero, as on the Maps page: a blue panel inside the page's guide
          lines, with the brand pattern, a title and a short description. */}
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="relative isolate overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary via-primary/85 to-primary/60" />
            <Grain />
            <Image
              src="/brand/Pattern.svg"
              alt=""
              width={1378}
              height={617}
              className="pointer-events-none absolute top-24 -left-1/4 -z-10 h-auto w-full scale-150 opacity-60 invert"
            />
            <Image
              src="/brand/Pattern.svg"
              alt=""
              width={1378}
              height={617}
              className="pointer-events-none absolute top-40 -right-1/3 -z-10 h-auto w-full rotate-180 scale-150 opacity-60 invert"
            />
            {/* The fixed navigation bar covers the top of the hero by
                --nav-height (in screen pixels, hence the division by the
                zoom), so that much is added above the same padding as below:
                the text sits centred in the blue that shows. */}
            <div className="px-6 pt-[calc(var(--nav-height)/var(--viewport-scale)+4rem)] pb-16 text-center md:pt-[calc(var(--nav-height)/var(--viewport-scale)+5rem)] md:pb-20">
              <h1 className="mx-auto max-w-3xl font-title text-4xl font-semibold leading-tight text-balance text-white md:text-[2.5rem]">
                {hero.title}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl leading-snug text-white/90">{hero.description}</p>
            </div>
          </div>
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
              <Eyebrow className="text-center">
                {String(index + 1).padStart(2, "0")}. {step.label}
              </Eyebrow>
              <div className="mx-auto mt-6 grid max-w-4xl gap-6 md:grid-cols-2 md:items-center md:gap-16">
                <h3 className="font-title text-3xl font-semibold leading-tight text-dark md:text-4xl">
                  <LineBreaks text={step.title} breakClassName="hidden md:inline" />
                </h3>
                <p className="max-w-md leading-relaxed text-dark/60">{step.description}</p>
              </div>
              {STEP_GRAPHICS[index] && (
                <div className="mt-10 md:mt-12">
                  {(() => {
                    const Graphic = STEP_GRAPHICS[index];
                    return <Graphic className="aspect-4/3 md:aspect-2/1" />;
                  })()}
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
                  <h3 className="font-title text-xl font-semibold leading-snug text-primary">
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
