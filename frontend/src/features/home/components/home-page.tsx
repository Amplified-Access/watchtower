"use client";

import Container from "@/components/common/container";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import LogoCloud from "@/components/logo-cloud";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Minus, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { trpc } from "@/_trpc/client";

import Footer from "@/components/layout/footer/page";
import LanguageMarquee from "@/components/common/language-marquee";
import StepConnector from "@/components/common/step-connector";
// import ScrollFadeText from "@/components/common/scroll-fade-text";
import LivePreviewSection from "@/features/home/components/live-preview-section";
import TrendsInfographic from "@/features/home/components/trends-infographic";
import VoiceReportInfographic from "@/features/home/components/voice-report-infographic";
import { Disc3 } from "@/components/animate-ui/icons/disc-3";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { Gavel } from "@/components/animate-ui/icons/gavel";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import LineBreaks from "@/components/common/line-breaks";
import LoopingVideo from "@/components/common/looping-video";
import type { HomePageContent } from "@/lib/sanity/types";
// import HealthCheck from "@/components/health-check"; helloooooo

// TODO: re-enable once insights content is ready for launch
const SHOW_INSIGHTS = false;

// A clip for each How it works step, in order: reporting, the maps, case
// studies. Each is a finished composition (its own background and browser
// frame), shown as it is. The steps' text is in Sanity; a step added there
// beyond these keeps the placeholder image.
const STEP_VIDEOS = ["home-report", "home-maps", "home-case-studies"].map((name) => ({
  src: `/videos/${name}.mp4`,
  poster: `/videos/${name}-poster.webp`,
  width: 1080,
  height: 850,
}));

// Experiment: steps whose clip is replaced by an animated illustration.
const STEP_INFOGRAPHICS: Record<number, React.ReactNode> = {
  0: <VoiceReportInfographic />,
  1: <TrendsInfographic />,
};

// The home page. Its text comes from the `homePage` document in Sanity (see
// app/(main)/page.tsx); only the "Step {number}" label is UI copy.
const HomePage = ({ content }: { content: HomePageContent }) => {
  const { hero, explore, stats, howItWorks, speakNaturally, insights: insightsText, partners, faqs, banner } = content;
  const t = useTranslations("Home");
  const { data: insightsData } = trpc.getPublicInsights.useQuery({ limit: 3 });

  // Falls back to static sample posts when there's no real data yet (empty
  // DB, or the query erroring) so the section isn't just hidden.
  const FALLBACK_INSIGHTS = insightsText.sampleTitles.map(({ _key, title }) => ({
    id: _key,
    slug: "",
    title,
    imageUrl: undefined as string | undefined,
    imageAlt: "",
    publishedAt: "2026-09-01",
    createdAt: "2026-09-01",
  }));
  const insights =
    insightsData && insightsData.length > 0 ? insightsData : FALLBACK_INSIGHTS;

  return (
    <>
      <section className="relative isolate bg-white overflow-hidden [zoom:var(--viewport-scale)]">
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute -bottom-55 left-0 -z-10 h-auto w-full invert"
        />
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="py-28">
          <Container className="pt-16 flex flex-col gap-8  h-full justify-center text-center items-center">
            {/* <HealthCheck /> */}
            <h1 className="text-4xl font-semibold max-w-xl  font-title leading-tight">
              <span className="block">{hero.titleLine1}</span>
              <span className="block">{hero.titleLine2}</span>
            </h1>
            <TextComponent className="max-w-3xl">
              {hero.description}
            </TextComponent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Link
                href={"/anonymous-reports"}
                className={cn(
                  buttonVariants({
                    variant: "default",
                    size: "lg",
                  }),
                  "font-title font-medium bg-dark text-white hover:bg-dark/90",
                )}
              >
                {hero.primaryCta}
                <ChevronRight />
              </Link>
              <Link
                href={"/sign-in"}
                className={cn(
                  buttonVariants({
                    variant: "secondary",
                    size: "lg",
                  }),
                  "font-title font-medium",
                )}
              >
                {hero.secondaryCta}
                <ChevronRight />
              </Link>
            </div>
          </Container>
        </div>
      </section>
      <section className="bg-white">
        <LanguageMarquee />
      </section>
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        {/* commented out while trying hero/mission configurations */}
        {/* <div className="border-b border-border">
          <Container size="xs" className="py-16 md:py-24">
            <ScrollFadeText
              text={t("missionStatement")}
              className="text-2xl font-title font-semibold leading-snug md:text-4xl"
            />
          </Container>
        </div> */}
        <Container size="xs" className="py-12 text-center md:py-16">
          <h3 className="mt-4 max-w-sm mx-auto font-title text-2xl font-semibold text-dark md:text-3xl">
            {explore.heading}
          </h3>
          <TextComponent className="mt-4 mx-auto max-w-xl">
            {explore.description}
          </TextComponent>
          {/* commented out while trying explore-section configurations */}
          {/* <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
            {explore.heading}
          </p> */}
        </Container>
      </section>
      <LivePreviewSection />
      <section className="relative isolate border-y border-border bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <Container size="xs">
          <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
            {stats.map((stat) => (
              <div
                key={stat._key}
                className="flex flex-col items-center justify-center gap-1 py-8 text-center md:py-10"
              >
                <span className="font-title text-3xl font-semibold text-dark md:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm text-dark/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="bg-white py-16 md:py-24 isolate [zoom:var(--viewport-scale)]">
        <Container size="lg">
          <div className="text-center mb-14 md:mb-20">
            {/* commented out while trying how-it-works configurations */}
            {/* <p className="mb-3 font-title text-xs  font-semibold uppercase tracking-widest text-primary">
              {howItWorks.heading}
            </p> */}
            <HeadingTwo className="text-center max-w-md mx-auto">
              {howItWorks.heading}
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-xl mx-auto text-center">
              {howItWorks.description}
            </TextComponent>
          </div>

          {/* Row gap matches the StepConnector height so the line spans it exactly */}
          <div className="flex flex-col gap-16 md:gap-24 lg:gap-40">
            {howItWorks.steps.map((step, index) => (
              <div
                key={step._key}
                className="relative grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                {index < howItWorks.steps.length - 1 && (
                  <StepConnector
                    from={index % 2 === 0 ? "left" : "right"}
                    className="top-full hidden h-40 lg:block"
                  />
                )}
                <div className={cn(index % 2 === 1 && "md:order-2")}>
                  {STEP_INFOGRAPHICS[index] ? (
                    // Experiment: animated illustrations instead of the clips.
                    <div className="overflow-hidden rounded-xl">{STEP_INFOGRAPHICS[index]}</div>
                  ) : STEP_VIDEOS[index] ? (
                    // Rounded like the placeholder card it replaces. The wrapper
                    // does the clipping: browsers don't reliably round a video itself.
                    <div className="overflow-hidden rounded-xl">
                      <LoopingVideo {...STEP_VIDEOS[index]} className="block" />
                    </div>
                  ) : (
                    <Image
                      src="/placeholder.png"
                      alt=""
                      width={677}
                      height={561}
                      className="h-auto w-full"
                    />
                  )}
                </div>
                <div className={cn(index % 2 === 1 && "md:order-1")}>
                  <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                    {t("stepLabel", { number: index + 1 })}
                  </p>
                  <h3 className="font-title text-3xl font-semibold text-dark md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-dark/60 leading-relaxed">
                    {step.description}
                  </p>
                  {/* TODO: replace placeholder CTA with the real per-step link */}
                  <Link
                    href="#"
                    className="mt-6 inline-flex items-center gap-1 font-title font-semibold text-primary hover:text-primary/80"
                  >
                    Learn more
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="relative bg-white pb-16 [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border" />
        <div className="pointer-events-none absolute inset-x-0 bottom-16 h-px bg-border" />
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="relative isolate overflow-hidden bg-dark px-6 py-16 md:px-16 md:py-20">
            <Image
              src="/brand/Pattern.svg"
              alt=""
              width={1378}
              height={617}
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-auto w-full opacity-40"
            />
            <Image
              src="/asset.svg"
              alt=""
              width={552}
              height={594}
              className="pointer-events-none absolute inset-y-0 right-0 -top-10 -z-10 hidden scale-125 h-full object-cover object-left md:block md:w-48"
            />
            <div className="relative z-10 flex flex-col gap-10 md:flex-row md:items-center md:gap-40">
              <h2 className="font-title text-3xl font-semibold leading-tight text-white md:text-4xl">
                <LineBreaks text={speakNaturally.title} />
              </h2>
              <div className="shrink-0">
                <p className="max-w-xs text-white/60 leading-relaxed">
                  {speakNaturally.description}
                </p>
                <Link
                  href="/anonymous-reports"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "mt-6 font-title font-medium",
                  )}
                >
                  {speakNaturally.cta}
                  <ChevronRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {SHOW_INSIGHTS && (
        <section className="relative bg-white py-16 md:py-24 isolate [zoom:var(--viewport-scale)]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-linear-to-t from-primary/15 to-transparent md:h-80" />
          <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
            <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
            <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
          </div>
          <Container size="lg" className="px-8 md:px-12 xl:px-20">
            <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                  {insightsText.label}
                </p>
                <h2 className="max-w-md font-title text-3xl font-semibold text-dark md:text-4xl">
                  {insightsText.heading}
                </h2>
              </div>
              <div className="flex flex-col gap-4 md:items-end md:text-right">
                <p className="max-w-sm text-dark/60">
                  {insightsText.description}
                </p>
                <Link
                  href="/insights"
                  className="inline-flex items-center gap-1 font-title font-semibold text-primary hover:text-primary/80"
                >
                  {insightsText.cta}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {insights.map((insight) => (
                <Link
                  key={insight.id}
                  href={
                    insight.slug ? `/insights/${insight.slug}` : "/insights"
                  }
                  className="group flex h-full flex-col"
                >
                  <div className="aspect-video bg-dark/5">
                    {insight.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={insight.imageUrl}
                        alt={insight.imageAlt || insight.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col bg-white p-4">
                    <h3 className="font-title text-lg font-semibold text-dark">
                      {insight.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                      <span className="inline-flex items-center gap-1 font-title font-semibold text-primary">
                        {insightsText.readStory}
                        <ChevronRight className="size-3.5" />
                      </span>
                      <span className="text-dark/50">
                        {new Date(
                          insight.publishedAt ?? insight.createdAt,
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
      <LogoCloud heading={partners.heading} logos={partners.logos} />
      {/* The footer's FAQs link lands here (/#faqs). The fixed navigation
          bar covers the top of the page by --nav-height (in screen pixels,
          hence the division by the zoom), so the scroll stops that much
          short. Not --banner-height: the home page has no banner, but the
          jump happens before the header resets it (and on a direct visit,
          while it still holds the stylesheet's default). */}
      <section
        id="faqs"
        className="relative isolate scroll-mt-[calc(var(--nav-height)/var(--viewport-scale))] bg-white pb-16 [zoom:var(--viewport-scale)]"
      >
        {/* Pattern spans the full width and stops at the bottom rule; the
            container is marked only by the guide lines drawn over it. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-16 -z-10 overflow-hidden">
          <Image
            src="/brand/Pattern.svg"
            alt=""
            width={1378}
            height={617}
            className="absolute inset-x-0 bottom-0 h-auto w-full opacity-40 invert"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border" />
        <div className="pointer-events-none absolute inset-x-0 bottom-16 h-px bg-border" />
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
          <div className="relative px-6 py-16 md:px-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                  {faqs.label}
                </p>
                <h2 className="font-title text-3xl font-semibold leading-tight text-dark md:text-4xl">
                  {faqs.heading}
                </h2>
                <p className="mt-4 max-w-xs text-dark/60 leading-relaxed">
                  {faqs.description}
                </p>
              </div>

              <Accordion
                type="single"
                collapsible
                defaultValue={faqs.items[0]?._key}
                className="w-full"
              >
                {faqs.items.map(({ _key, question, answer }) => (
                  <AccordionItem
                    key={_key}
                    value={_key}
                    className="border-dark/10"
                  >
                    <AccordionTrigger className="group gap-4 py-5 font-title text-base text-dark hover:no-underline [&>svg]:hidden">
                      <span className="flex-1">{question}</span>
                      <span className="relative flex size-6 shrink-0 items-center justify-center rounded bg-primary">
                        <Plus className="size-3.5 text-white group-data-[state=open]:hidden" />
                        <Minus className="absolute size-3.5 text-white opacity-0 group-data-[state=open]:opacity-100" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-base leading-relaxed font-normal text-dark/60">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>
      {/* <section className="py-20">
        <Container>
          <HeadingTwo className="text-center">Live incident mapping</HeadingTwo>
          <TextComponent>The watchtower </TextComponent>
          <Image
            src={"/images/maps.png"}
            height={500}
            width={1000}
            className="w-full object-contain"
          />
        </Container>
      </section> */}
      <section className="relative isolate bg-primary py-4 text-white [zoom:var(--viewport-scale)]">
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-center text-sm font-medium md:px-8 xl:px-16">
          <span>{banner.text}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {banner.cta}
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default HomePage;
