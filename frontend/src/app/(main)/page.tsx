"use client";

import CallToAction from "@/components/common/call-to-action";
import Container from "@/components/common/container";
import H4 from "@/components/common/heading-four";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import LogoCloud from "@/components/logo-cloud";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import Footer from "@/components/layout/footer/page";
import LanguageMarquee from "@/components/common/language-marquee";
import ScrollFadeText from "@/components/common/scroll-fade-text";
import { Disc3 } from "@/components/animate-ui/icons/disc-3";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { ClipboardList } from "@/components/animate-ui/icons/clipboard-list";
import { Gavel } from "@/components/animate-ui/icons/gavel";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import { Blocks } from "@/components/animate-ui/icons/blocks";
import { Loader } from "@/components/animate-ui/icons/loader";
// import HealthCheck from "@/components/health-check"; helloooooo

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
        <p className="text-sm text-dark/60 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const Page = () => {
  const t = useTranslations("Home");

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
        <div className="py-32 2xl:py-40">
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
        <div className="border-b border-border">
          <Container size="xs" className="py-16 md:py-24">
            <ScrollFadeText
              text={t("missionStatement")}
              className="text-2xl font-title font-semibold leading-snug md:text-4xl"
            />
          </Container>
        </div>
        <Container size="xs" className="pt-16 pb-8 text-center md:pt-24">
          <p className="mb-3 font-title text-xs font-semibold uppercase tracking-widest text-primary">
            {t("exploreLabel")}
          </p>
          <TextComponent className="mx-auto max-w-xl">
            {t("exploreDescription")}
          </TextComponent>
          <h3 className="mt-4 max-w-sm mx-auto font-title text-2xl font-semibold text-dark md:text-3xl">
            {t("exploreHeading")}
          </h3>
        </Container>
      </section>
      <section className="py-16 md:py-24 isolate [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="text-center mb-14 md:mb-20">
            <HeadingTwo className="text-center">{t("howItWorks")}</HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              {t("howItWorksDescription")}
            </TextComponent>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Visual */}
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

            {/* Steps timeline */}
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-24 w-px bg-dark/15" />
              <div
                className="hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-dark/15"
                style={{ right: "calc(100% - 1.25rem)", width: "11rem" }}
              />
              <StepCard
                icon={ClipboardList}
                part={t("stepLabel", { number: 1 })}
                title={t("step1Title")}
                description={t("step1Description")}
              />
              <StepCard
                icon={Loader}
                part={t("stepLabel", { number: 2 })}
                title={t("step2Title")}
                description={t("step2Description")}
              />
              <StepCard
                icon={Blocks}
                part={t("stepLabel", { number: 3 })}
                title={t("step3Title")}
                description={t("step3Description")}
              />
            </div>
          </div>
        </Container>
      </section>
      <section className="  py-10 [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <LogoCloud />
        </Container>
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
      <section className="py-16 md:py-20 [zoom:var(--viewport-scale)]">
        <Container size="xs">
          <div className="bg-primary rounded-3xl py-8 md:py-16 px-4 md:px-16">
            <div className="text-center mb-10 md:mb-14 ">
              <h2 className="text-3xl md:text-4xl font-semibold font-title text-white leading-tight">
                {t("impactTitle")}
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                {t("impactDescription")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { value: "6", label: t("statCountries") },
                { value: "13", label: t("statLanguages") },
                { value: "22", label: t("statDeployments") },
                { value: "2,000+", label: t("statWeeklyUsers") },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 border border-white/20 rounded-2xl py-8 px-4 flex aspect-square justify-center flex-col items-center text-center"
                >
                  <span className="text-4xl md:text-4xl font-semibold font-title text-white">
                    {stat.value}
                  </span>
                  <span className="mt-2 text-sm font-medium text-white/70 font-title tracking-wide">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      <section className="py-16 md:pb-20 [zoom:var(--viewport-scale)]">
        <Container className="" size="xs">
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
                link: "/maps",
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
