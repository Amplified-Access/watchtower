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
import { useTranslations } from "next-intl";

import Footer from "@/components/layout/footer/page";
import LanguageMarquee from "@/components/common/language-marquee";
import ScrollFadeText from "@/components/common/scroll-fade-text";
import LivePreviewSection from "@/features/home/components/live-preview-section";
import { Disc3 } from "@/components/animate-ui/icons/disc-3";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { Gavel } from "@/components/animate-ui/icons/gavel";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
// import HealthCheck from "@/components/health-check"; helloooooo

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
              { number: 1, title: t("step1Title"), description: t("step1Description") },
              { number: 2, title: t("step2Title"), description: t("step2Description") },
              { number: 3, title: t("step3Title"), description: t("step3Description") },
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
                    className="h-auto w-full rounded-2xl"
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
