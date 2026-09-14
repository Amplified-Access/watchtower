"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Container from "@/components/common/container";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import CallToAction from "@/components/common/call-to-action";
import Footer from "@/components/layout/footer/page";
import { buttonVariants } from "@/components/ui/button";
import { ClipboardList } from "@/components/animate-ui/icons/clipboard-list";
import { Loader } from "@/components/animate-ui/icons/loader";
import { Blocks } from "@/components/animate-ui/icons/blocks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

const StepCard = ({
  icon: Icon,
  part,
  title,
  description,
}: {
  icon: React.ComponentType<{ animate?: boolean; size?: number }>;
  part: string;
  title: string;
  description: string;
}) => {
  const [animate, setAnimate] = useState(false);
  return (
    <div
      className="relative flex gap-5 pb-10 last:pb-0 group"
      onMouseEnter={() => setAnimate(true)}
      onMouseLeave={() => setAnimate(false)}
    >
      <div className="size-10 shrink-0 rounded-full bg-background border border-dark/20 group-hover:border-primary group-hover:bg-primary/5 flex items-center justify-center z-10 mt-1 transition-colors duration-200">
        <Icon animate={animate} size={18} />
      </div>
      <div className="pt-1">
        <p className="text-xs font-title uppercase tracking-widest text-dark/40 mb-1">
          {part}
        </p>
        <h4 className="font-title font-semibold text-dark text-base md:text-lg mb-2">
          {title}
        </h4>
        <p className="text-dark/60 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const Page = () => {
  const t = useTranslations("About");
  const tHome = useTranslations("Home");

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
      <section className="relative [zoom:var(--viewport-scale)]">
        <Image
          src="/topographic.svg"
          alt=""
          width={500}
          height={500}
          className="w-full object-cover h-full absolute top-0 -z-1 opacity-20"
        />
        <div className="h-32 bg-linear-to-b from-transparent to-background w-full absolute bottom-0" />
        <div className="pt-32 pb-28">
          <Container className="pt-32 flex flex-col gap-6 text-center items-center">
            <h1 className="text-4xl font-semibold font-title leading-tight max-w-3xl">
              {t("heroTitle")}
            </h1>
            <TextComponent className="max-w-4xl md:text-xl">
              {t("heroDescription")}
            </TextComponent>
            {/* <Link
              href="/anonymous-reports"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "font-title font-medium",
              )}
            >
              Submit a report
            </Link> */}
          </Container>
        </div>
      </section>
      {/* Hero */}
      <section className="relative [zoom:var(--viewport-scale)]">
        <div className="h-32 bg-linear-to-b from-transparent to-background w-full absolute bottom-0" />
        <div className="pb-32 pt-20">
          <Container size="xs">
            <div className="py-32 flex flex-col gap-6 text-center items-center bg-white border rounded-3xl p-6">
              <h1 className="text-4xl font-semibold font-title leading-tight max-w-3xl">
                {t("objectiveTitle")}
              </h1>
              <TextComponent className="max-w-3xl">
                {t("objectiveDescription")}
              </TextComponent>
            </div>
            {/* <Link
              href="/anonymous-reports"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "font-title font-medium",
              )}
            >
              Submit a report
            </Link> */}
          </Container>
        </div>
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
      <section className="pb-20 md:pb-32 isolate [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="text-center mb-14 md:mb-20">
            <HeadingTwo className="text-center">
              {tHome("howItWorks")}
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              {tHome("howItWorksDescription")}
            </TextComponent>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="flex justify-center">
              <div className="relative size-72 md:size-80 rounded-full bg-primary overflow-hidden flex items-center justify-center">
                <Image
                  src="/topographic.svg"
                  alt=""
                  width={500}
                  height={500}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-6 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/15" />
                <div className="absolute inset-20 rounded-full border border-white/20" />
                <div className="relative z-10">
                  <Image
                    src="/brand/icon-white.svg"
                    alt="WatchTower"
                    width={300}
                    height={300}
                    className="h-20 w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-5 bottom-16 w-px bg-dark/15" />
              <div
                className="hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-dark/15"
                style={{ right: "calc(100% - 1.25rem)", width: "11rem" }}
              />
              <StepCard
                icon={ClipboardList}
                part={tHome("stepLabel", { number: 1 })}
                title={tHome("step1Title")}
                description={tHome("step1Description")}
              />
              <StepCard
                icon={Loader}
                part={tHome("stepLabel", { number: 2 })}
                title={tHome("step2Title")}
                description={tHome("step2Description")}
              />
              <StepCard
                icon={Blocks}
                part={tHome("stepLabel", { number: 3 })}
                title={tHome("step3Title")}
                description={tHome("step3Description")}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Languages */}
      <section className="pb-20 md:pb-32 [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="rounded-3xl bg-primary p-8 md:p-16">
            <div className="text-center mb-12">
              {/* <p className="text-white/60 font-title font-semibold uppercase tracking-widest text-sm mb-4">
                Languages Available
              </p> */}
              <h2 className="font-title font-semibold text-3xl md:text-4xl text-white leading-tight">
                {t("languagesTitle")}
              </h2>
              <TextComponent className="text-white/60 mt-4 max-w-3xl mx-auto text-center">
                {t("languagesDescription", { count: languages.length })}
              </TextComponent>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col gap-1 text-center hover:bg-white/15 transition-colors"
                >
                  <span className="font-title font-semibold text-white text-sm">
                    {lang.name}
                  </span>
                  <span className="text-white/55 text-xs">{lang.region}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Impact */}
      <section className="pb-20 md:pb-32 [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="bg-white border rounded-3xl pt-8 pb-4 md:py-16 px-4 md:px-16">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold font-title leading-tight">
                {tHome("impactTitle")}
              </h2>
              <TextComponent className="mt-3 max-w-xl mx-auto text-center">
                {tHome("impactDescription")}
              </TextComponent>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { value: "6", label: tHome("statCountries") },
                { value: "13", label: tHome("statLanguages") },
                { value: "22", label: tHome("statDeployments") },
                { value: "2,000+", label: tHome("statWeeklyUsers") },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-500/10 border border-white/20 rounded-2xl py-8 px-4 flex aspect-square justify-center flex-col items-center text-center"
                >
                  <span className="text-3xl md:text-4xl font-semibold font-title text-dark">
                    {stat.value}
                  </span>
                  <span className="mt-2 text-sm font-medium text-dark/70 font-title tracking-wide">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
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
      <section className="pb-20 md:pb-32 text-background [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="bg-primary p-10 md:p-16 rounded-3xl">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
              <div>
                <h2 className="font-title font-semibold text-3xl md:text-4xl text-background leading-snug">
                  {t("safetyTitle")}
                </h2>
                <TextComponent className="text-white/60 mt-4">
                  {t("safetyDescription")}
                </TextComponent>
              </div>

              <Accordion type="single" collapsible className="w-full">
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
                    className="border-white/15"
                  >
                    <AccordionTrigger className="font-title text-background text-base hover:no-underline hover:text-background/80 [&>svg]:text-background/40 py-5">
                      {question}
                    </AccordionTrigger>
                    <AccordionContent className="text-background/60 leading-relaxed font-normal text-base pb-5">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-20 md:pb-24 [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <CallToAction
            callToAction={{
              title: t("ctaTitle"),
              description: t("ctaDescription"),
              variant: "secondary",
              button1: {
                title: t("ctaButton1"),
                link: "/anonymous-reports",
              },
              button2: {
                title: t("ctaButton2"),
                link: "/maps/live-incident-map",
              },
            }}
            color="white"
          />
        </Container>
      </section>

      <Footer />
    </>
  );
};

export default Page;
