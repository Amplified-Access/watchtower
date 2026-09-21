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
// import ScrollFadeText from "@/components/common/scroll-fade-text";
import LivePreviewSection from "@/features/home/components/live-preview-section";
import { Disc3 } from "@/components/animate-ui/icons/disc-3";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { Gavel } from "@/components/animate-ui/icons/gavel";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
// import HealthCheck from "@/components/health-check"; helloooooo

// TODO: re-enable once insights content is ready for launch
const SHOW_INSIGHTS = false;

const Page = () => {
  const t = useTranslations("Home");
  const { data: insightsData } = trpc.getPublicInsights.useQuery({ limit: 3 });

  // Falls back to static sample posts when there's no real data yet (empty
  // DB, or the query erroring) so the section isn't just hidden.
  const FALLBACK_INSIGHTS = [
    {
      id: "fallback-1",
      slug: "",
      title: t("insightsFallback1Title"),
      imageUrl: undefined as string | undefined,
      imageAlt: "",
      publishedAt: "2026-09-01",
      createdAt: "2026-09-01",
    },
    {
      id: "fallback-2",
      slug: "",
      title: t("insightsFallback2Title"),
      imageUrl: undefined as string | undefined,
      imageAlt: "",
      publishedAt: "2026-09-01",
      createdAt: "2026-09-01",
    },
    {
      id: "fallback-3",
      slug: "",
      title: t("insightsFallback3Title"),
      imageUrl: undefined as string | undefined,
      imageAlt: "",
      publishedAt: "2026-09-01",
      createdAt: "2026-09-01",
    },
  ];
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
              <span className="block">{t("heroTitleLine1")}</span>
              <span className="block">{t("heroTitleLine2")}</span>
            </h1>
            <TextComponent className="max-w-3xl">
              {t("heroDescription")}
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
                {t("startReporting")}
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
                {t("viewMaps")}
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
            {t("exploreLabel")}
          </h3>
          <TextComponent className="mt-4 mx-auto max-w-xl">
            {t("exploreDescription")}
          </TextComponent>
          {/* commented out while trying explore-section configurations */}
          {/* <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
            {t("exploreLabel")}
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
            {[
              { value: "2,000+", label: t("statWeeklyUsers") },
              { value: "22", label: t("statDeployments") },
              { value: "13", label: t("statLanguages") },
              { value: "6", label: t("statCountries") },
            ].map((stat) => (
              <div
                key={stat.label}
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
            <p className="mb-3 font-title text-xs  font-semibold uppercase tracking-widest text-primary">
              {t("howItWorks")}
            </p>
            <HeadingTwo className="text-center max-w-md mx-auto">
              {t.rich("howItWorksHeading", { break: () => <br /> })}
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-xl mx-auto text-center">
              {t("howItWorksDescription")}
            </TextComponent>
          </div>

          <div className="flex flex-col gap-16 md:gap-24">
            {[
              {
                number: 1,
                title: t("step1Title"),
                description: t("step1Description"),
              },
              {
                number: 2,
                title: t("step2Title"),
                description: t("step2Description"),
              },
              {
                number: 3,
                title: t("step3Title"),
                description: t("step3Description"),
              },
            ].map((step, index) => (
              <div
                key={step.number}
                className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <div className={cn(index % 2 === 1 && "md:order-2")}>
                  <Image
                    src="/placeholder.png"
                    alt=""
                    width={677}
                    height={561}
                    className="h-auto w-full"
                  />
                </div>
                <div className={cn(index % 2 === 1 && "md:order-1")}>
                  <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                    {t("stepLabel", { number: step.number })}
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
              src="/asset.svg"
              alt=""
              width={552}
              height={594}
              className="pointer-events-none absolute inset-y-0 right-0 -top-10 -z-10 scale-125 h-full object-cover object-left md:w-48"
            />
            <div className="relative z-10 grid gap-10 md:grid-cols-2 md:gap-16 md:items-center">
              <h2 className="font-title text-3xl font-semibold leading-tight text-white md:text-4xl">
                {t("speakNaturallyTitle")}
              </h2>
              <div>
                <p className="max-w-xs text-white/60 leading-relaxed">
                  {t("speakNaturallyDescription")}
                </p>
                <Link
                  href="/anonymous-reports"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "mt-6 font-title font-medium",
                  )}
                >
                  {t("speakNaturallyCta")}
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
                  {t("insightsLabel")}
                </p>
                <h2 className="max-w-md font-title text-3xl font-semibold text-dark md:text-4xl">
                  {t("insightsHeading")}
                </h2>
              </div>
              <div className="flex flex-col gap-4 md:items-end md:text-right">
                <p className="max-w-sm text-dark/60">
                  {t("insightsDescription")}
                </p>
                <Link
                  href="/insights"
                  className="inline-flex items-center gap-1 font-title font-semibold text-primary hover:text-primary/80"
                >
                  {t("insightsCta")}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {insights.map((insight) => (
                <Link
                  key={insight.id}
                  href={insight.slug ? `/insights/${insight.slug}` : "/insights"}
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
                        {t("readStory")}
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
      <LogoCloud />
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
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("faqsLabel")}
                </p>
                <h2 className="font-title text-3xl font-semibold leading-tight text-white md:text-4xl">
                  {t("faqsHeading")}
                </h2>
                <p className="mt-4 max-w-xs text-white/60 leading-relaxed">
                  {t("faqsDescription")}
                </p>
              </div>

              <Accordion
                type="single"
                collapsible
                defaultValue="faq-1"
                className="w-full"
              >
                {[
                  {
                    value: "faq-1",
                    question: t("faq1Question"),
                    answer: t("faq1Answer"),
                  },
                  {
                    value: "faq-2",
                    question: t("faq2Question"),
                    answer: t("faq2Answer"),
                  },
                  {
                    value: "faq-3",
                    question: t("faq3Question"),
                    answer: t("faq3Answer"),
                  },
                  {
                    value: "faq-4",
                    question: t("faq4Question"),
                    answer: t("faq4Answer"),
                  },
                  {
                    value: "faq-5",
                    question: t("faq5Question"),
                    answer: t("faq5Answer"),
                  },
                ].map(({ value, question, answer }) => (
                  <AccordionItem
                    key={value}
                    value={value}
                    className="border-white/15"
                  >
                    <AccordionTrigger className="group gap-4 py-5 font-title text-base text-white hover:no-underline [&>svg]:hidden">
                      <span className="flex-1">{question}</span>
                      <span className="relative flex size-6 shrink-0 items-center justify-center rounded bg-primary">
                        <Plus className="size-3.5 text-white group-data-[state=open]:hidden" />
                        <Minus className="absolute size-3.5 text-white opacity-0 group-data-[state=open]:opacity-100" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-base leading-relaxed font-normal text-white/60">
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
          <span>{t("ctaTitle")}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {t("ctaButton1")}
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Page;
