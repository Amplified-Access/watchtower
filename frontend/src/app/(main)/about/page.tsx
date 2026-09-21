"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Container from "@/components/common/container";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import Footer from "@/components/layout/footer/page";
import LanguageMarquee from "@/components/common/language-marquee";
import StepConnector from "@/components/common/step-connector";
import { buttonVariants } from "@/components/ui/button";
import { ChevronRight, Minus, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

const Page = () => {
  const t = useTranslations("About");
  const tHome = useTranslations("Home");
  const tNav = useTranslations("Navigation");

  const languages = [
    { name: t("langEnglish"), region: t("regionGlobal"), code: "en" },
    { name: t("langAmharic"), region: t("regionEthiopia"), code: "am" },
    { name: t("langFrench"), region: t("regionGlobal"), code: "fr" },
    { name: t("langKikuyu"), region: t("regionKenya"), code: "ki" },
    { name: t("langLuganda"), region: t("regionUganda"), code: "lg" },
    { name: t("langPunjabi"), region: t("regionSouthAsia"), code: "pa" },
    { name: t("langKinyarwanda"), region: t("regionRwanda"), code: "rw" },
    { name: t("langSukuma"), region: t("regionTanzania"), code: "suk" },
    { name: t("langSwahili"), region: t("regionEastAfrica"), code: "sw" },
    { name: t("langUrdu"), region: t("regionPakistan"), code: "ur" },
    { name: t("langLuo"), region: t("regionKenya"), code: "luo" },
    { name: t("langOromo"), region: t("regionEthiopia"), code: "om" },
    { name: t("langDinka"), region: t("regionSouthSudan"), code: "din" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-white md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-white md:right-8 xl:right-16" />
          <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-white md:block" />
          {/* Watermark rides with the rails so it tucks just inside the right
              one at every breakpoint, instead of drifting across it on wide
              screens and getting sheared off by the section's overflow-hidden. */}
          <Image
            src="/brand/icon-white.svg"
            alt=""
            width={40}
            height={37}
            className="absolute bottom-0 right-23 h-10 w-10 mb-6"
          />
        </div>
        <div className="py-16 md:pt-20 md:pb-4">
          <Container className="px-8 md:px-14 xl:px-24">
            <div className="grid divide-y divide-white md:grid-cols-2 md:items-center md:divide-y-0">
              <div className="py-10 md:pb-0 md:pr-12 xl:pr-16">
                <p className="mb-4 font-title text-xs font-semibold uppercase tracking-widest text-white/70">
                  {tNav("about")} WatchTower
                </p>
                <h1 className="max-w-xl font-title text-4xl font-semibold leading-tight text-white">
                  {t("heroTitle")}
                </h1>
                <div className="mt-8 -ml-4 -mr-4 h-px bg-white md:-ml-6 md:-mr-12 xl:-ml-8 xl:-mr-16" />
                <div className="mt-8 flex max-w-lg flex-col gap-4">
                  <TextComponent className="text-white/70">
                    {t("heroDescription")}
                  </TextComponent>
                  <TextComponent className="text-white/70">
                    {t("objectiveDescription")}
                  </TextComponent>
                </div>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-xs pt-10 md:max-w-sm md:pt-0 md:pl-12 xl:pl-16">
                <Image
                  src="/about-globe.png"
                  alt=""
                  width={459}
                  height={459}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </Container>
        </div>
      </section>
      <section className="bg-white">
        <LanguageMarquee />
      </section>

      {/* Mission
      <section className="py-20 md:py-32 bg-dark text-background [zoom:var(--viewport-scale)]">
        <Container size="text" className="text-center flex flex-col gap-6">
          <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">
            Our Mission
          </p>
          <h2 className="font-title font-semibold text-3xl md:text-4xl leading-snug">
            To empower communities to document, report, and respond to civic
            incidents in the languages they speak
          </h2>
          <p className="text-background/65 text-lg max-w-2xl mx-auto leading-relaxed">
            Across Africa and beyond, critical civic events go unreported simply
            because reporting tools do not speak people&apos;s languages.
            WatchTower removes that barrier so that everyone can participate in
            public accountability.
          </p>
        </Container>
      </section> */}

      {/* How It Works */}
      <section className="bg-white py-16 md:py-24 isolate [zoom:var(--viewport-scale)]">
        <Container size="lg">
          <div className="text-center mb-14 md:mb-20">
            {/* commented out while trying how-it-works configurations */}
            {/* <p className="mb-3 font-title text-xs  font-semibold uppercase tracking-widest text-primary">
              {tHome("howItWorks")}
            </p> */}
            <HeadingTwo className="text-center max-w-md mx-auto">
              {tHome("howItWorks")}
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-xl mx-auto text-center">
              {tHome("howItWorksDescription")}
            </TextComponent>
          </div>

          {/* Row gap matches the StepConnector height so the line spans it exactly */}
          <div className="flex flex-col gap-16 md:gap-24 lg:gap-40">
            {[
              {
                number: 1,
                title: tHome("step1Title"),
                description: tHome("step1Description"),
              },
              {
                number: 2,
                title: tHome("step2Title"),
                description: tHome("step2Description"),
              },
              {
                number: 3,
                title: tHome("step3Title"),
                description: tHome("step3Description"),
              },
            ].map((step, index) => (
              <div
                key={step.number}
                className="relative grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                {index < 2 && (
                  <StepConnector
                    from={index % 2 === 0 ? "left" : "right"}
                    className="top-full hidden h-40 lg:block"
                  />
                )}
                <div className={cn(index % 2 === 1 && "md:order-2")}>
                  <Image
                    src="/placeholder.png"
                    alt=""
                    width={677}
                    height={561}
                    className="h-auto w-full rounded-lg"
                  />
                </div>
                <div className={cn(index % 2 === 1 && "md:order-1")}>
                  <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
                    {tHome("stepLabel", { number: step.number })}
                  </p>
                  <h3 className="font-title text-3xl font-semibold text-dark md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-dark/60 leading-relaxed">
                    {step.description}
                  </p>
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

      {/* Languages */}
      <section className="relative isolate overflow-hidden bg-linear-to-b from-primary to-white [zoom:var(--viewport-scale)]">
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute -bottom-30 right-0 -z-10 h-auto w-full rotate-180 invert"
        />
        
        <div className="pt-20 pb-16 md:pt-28 md:pb-20">
          <Container size="xs" className="text-center">
            <HeadingTwo className="text-white">
              {t("languagesTitle")}
            </HeadingTwo>
            <TextComponent className="mx-auto mt-4 max-w-xl text-center text-white/70">
              {t("languagesDescription", { count: languages.length })}
            </TextComponent>
          </Container>
        </div>
        <div
          role="marquee"
          aria-label={`Supported languages: ${languages
            .map((lang) => lang.name)
            .join(", ")}`}
          className="overflow-hidden bg-white py-2.5"
        >
          <div className="flex w-max animate-marquee">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0 items-center font-title text-sm font-medium text-dark"
              >
                {languages.map((lang, index) => (
                  <span key={index} className="flex items-center">
                    <span className="px-3">{lang.name}</span>
                    <span className="text-dark/40">&bull;</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="relative isolate border-t border-border bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <Container size="xs" className="pt-16 md:pt-24">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-semibold font-title leading-tight">
              {tHome("impactTitle")}
            </h2>
            <TextComponent className="mt-3 max-w-xl mx-auto text-center">
              {tHome("impactDescription")}
            </TextComponent>
          </div>
        </Container>
        {/* Rail width, matching the dark block below, and no bottom padding so
            the cells butt straight up against it. The top rule lives on each
            cell rather than on the grid: that way it also serves as the row
            divider in the 2-col layout without doubling up on the first row. */}
        <div className="mx-auto mt-12 max-w-360 px-4 md:mt-16 md:px-8 xl:px-16">
          <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
            {[
              { value: "2,000+", label: tHome("statWeeklyUsers") },
              { value: "22", label: tHome("statDeployments") },
              { value: "13", label: tHome("statLanguages") },
              { value: "6", label: tHome("statCountries") },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-1 border-t border-border py-8 text-center md:py-10"
              >
                <span className="font-title text-3xl font-semibold text-dark md:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm text-dark/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Organisation */}
      {/* <section className="py-20 md:py-32">
        <Container size="xs">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
            <div>
              <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm mb-4">
                The Organisation
              </p>
              <HeadingTwo>
                Accountable, transparent, and mission-driven
              </HeadingTwo>
              <TextComponent className="mt-6">
                WatchTower is a product of Amplified Access, a registered
                nonprofit dedicated to building technology that expands civic
                participation in underserved communities.
              </TextComponent>
              <Link
                href="https://amplifiedaccess.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-title font-medium text-primary hover:opacity-70 transition-opacity"
              >
                amplifiedaccess.org
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-dark/10">
              {[
                {
                  icon: Building2,
                  label: "Legal status",
                  value: "Registered nonprofit, United States",
                },
                {
                  icon: Globe,
                  label: "Operating since",
                  value: "2022",
                },
                {
                  icon: FileText,
                  label: "Annual filings",
                  value: "Form 990 available on request",
                },
                {
                  icon: Users,
                  label: "Leadership",
                  value: "Noble and Aziz, Co-founders at Amplified Access",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="size-9 shrink-0 rounded-full border border-dark/10 flex items-center justify-center mt-0.5">
                    <Icon size={15} className="text-dark/50" />
                  </div>
                  <div>
                    <p className="text-xs font-title uppercase tracking-widest text-dark/40 mb-1">
                      {label}
                    </p>
                    <p className="text-dark font-medium text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section> */}

      {/* Your Safety */}
      <section className="relative isolate bg-white pb-16 [zoom:var(--viewport-scale)]">
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
                  {tHome("faqsLabel")}
                </p>
                <h2 className="font-title text-3xl font-semibold leading-tight text-dark md:text-4xl">
                  {t.rich("safetyTitle", { break: () => <br /> })}
                </h2>
                <p className="mt-4 max-w-xs text-dark/60 leading-relaxed">
                  {t("safetyDescription")}
                </p>
              </div>

              <Accordion
                type="single"
                collapsible
                defaultValue="identity"
                className="w-full"
              >
                {[
                  {
                    value: "identity",
                    question: t("faqIdentityQuestion"),
                    answer: t("faqIdentityAnswer"),
                  },
                  {
                    value: "account",
                    question: t("faqAccountQuestion"),
                    answer: t("faqAccountAnswer"),
                  },
                  {
                    value: "encryption",
                    question: t("faqEncryptionQuestion"),
                    answer: t("faqEncryptionAnswer"),
                  },
                  {
                    value: "visibility",
                    question: t("faqVisibilityQuestion"),
                    answer: t("faqVisibilityAnswer"),
                  },
                  {
                    value: "device",
                    question: t("faqDeviceQuestion"),
                    answer: t("faqDeviceAnswer"),
                  },
                ].map(({ value, question, answer }) => (
                  <AccordionItem
                    key={value}
                    value={value}
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

      {/* CTA */}
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
          className="pointer-events-none absolute -bottom-60 left-0 -z-10 h-auto w-full invert"
        />
        {/* The FAQ section above ends with 64px of space below its rule, so the
            top padding is trimmed and the bottom grown by the same amount:
            same height, content centred between that rule and the ribbon. */}
        <Container size="xs" className="pt-3 pb-29 text-center md:pt-7 md:pb-33">
          <HeadingTwo className="text-center">{t("ctaTitle")}</HeadingTwo>
          <TextComponent className="mx-auto mt-4 max-w-xl text-center">
            {t("ctaDescription")}
          </TextComponent>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/anonymous-reports"
              className={cn(
                buttonVariants({ variant: "default" }),
                "font-title font-medium bg-dark text-white hover:bg-dark/90",
              )}
            >
              {t("ctaButton1")}
              <ChevronRight />
            </Link>
            <Link
              href="/maps/live-incident-map"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "font-title font-medium",
              )}
            >
              {t("ctaButton2")}
              <ChevronRight />
            </Link>
          </div>
        </Container>
      </section>

      <section className="relative isolate bg-primary py-4 text-white [zoom:var(--viewport-scale)]">
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-center text-sm font-medium md:px-8 xl:px-16">
          <span>{tHome("ctaTitle")}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {tHome("ctaButton1")}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Page;
