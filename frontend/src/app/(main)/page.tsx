"use client";

import CallToAction from "@/components/common/call-to-action";
import Container from "@/components/common/container";
import H4 from "@/components/common/heading-four";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import LogoCloud from "@/components/logo-cloud";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import Footer from "@/components/layout/footer/page";
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
      <section className="relative md:mb-10">
        <div className="h-32 bg-linear-to-b from-transparent to-background w-full absolute bottom-0" />
        <Image
          src={"/topographic.svg"}
          alt={""}
          width={500}
          height={500}
          className="w-full object-cover h-full absolute top-0 -z-1 opacity-20"
        />
        <div className="py-32 2xl:py-40">
          <Container className="pt-16 flex flex-col gap-8  h-full justify-center text-center items-center">
            {/* <HealthCheck /> */}
            <h1 className="text-4xl font-semibold max-w-xl  font-title leading-tight">
              <span className="block">
                {/* {t("heroTitleLine1")} */}
                Report civic incidents in your language. Be heard!
              </span>
              {/* <span className="block">{t("heroTitleLine2")}</span> */}
            </h1>
            <TextComponent className="max-w-3xl">
              {/* {t("heroDescription")} */}
              When communities can speak up, things change. Watchtower enables
              people to report local issues and rights violations in the
              languages they speak so that everyone can participate in civic
              life and public accountability.
            </TextComponent>
            <div className="flex items-center gap-4">
              <Link
                href={"/anonymous-reports"}
                className={cn(
                  buttonVariants({
                    variant: "default",
                    size: "lg",
                  }),
                  "font-title font-medium",
                )}
              >
                {/* {t("startReporting")} */}
                Submit a report
              </Link>
              <Link
                href={"/sign-in"}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                  }),
                  "font-title font-medium",
                )}
              >
                {/* {t("viewMaps")} */}
                Create a deployment
              </Link>
            </div>
          </Container>
        </div>
      </section>
      <section className="py-16 md:py-24 isolate">
        <Container size="xs">
          <div className="text-center mb-14 md:mb-20">
            <HeadingTwo className="text-center">{t("howItWorks")}</HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              From a single report to system-wide change, here is how WatchTower
              is enabling communities to make their voices heard and drive
              meaningful change.
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
                  className="absolute inset-0 w-full h-full object-cover opacity-15"
                />
                <div className="absolute inset-6 rounded-full border border-white/10" />
                <div className="absolute inset-12 rounded-full border border-white/15" />
                <div className="absolute inset-20 rounded-full border border-white/20" />
                <div className="relative z-10">
                  <Image
                    src="/icons/icon-white.png"
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
              <div className="absolute left-5 top-5 bottom-16 w-px bg-dark/15" />
              <div
                className="hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-dark/15"
                style={{ right: "calc(100% - 1.25rem)", width: "11rem" }}
              />
              <StepCard
                icon={ClipboardList}
                part="Step 1"
                // title={t("step1Title")}
                title="Enable reporting"
                description="We provide technology to facilitate individuals and communities to report community issues or rights violations directly from their phone or cumputer in a language they speak."
              />
              <StepCard
                icon={Loader}
                part="Step 2"
                title={"Understand trends"}
                description="We process and verify every report, mapping incidents and surfacing patterns that would otherwise go unnoticed. Raw information becomes clear, structured intelligence that tells a bigger story."
              />
              <StepCard
                icon={Blocks}
                part="Step 3"
                title={"Drive action"}
                description="Communities, organizations and institutions access these insights to build cases, hold the right people accountable, and push for meaningful change, backed by real evidence from the ground."
              />
            </div>
          </div>
        </Container>
      </section>
      <section className="  py-10">
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
      <section className="py-16 md:py-20">
        <Container size="xs">
          <div className="bg-primary rounded-3xl py-16 px-16">
            <div className="text-center mb-10 md:mb-14 ">
              <h2 className="text-3xl md:text-4xl font-semibold font-title text-white leading-tight">
                Our impact
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                Explore how communities are making their voices heard, shaping
                decisions and driving action.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { value: "6", label: "Countries" },
                { value: "9", label: "Languages" },
                { value: "22", label: "Deployments" },
                { value: "2,000+", label: "Weekly users" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 border border-white/20 rounded-2xl py-8 px-4 flex aspect-square justify-center flex-col items-center text-center"
                >
                  <span className="text-4xl md:text-5xl font-semibold font-title text-white">
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
      <section className="py-16 md:pb-20">
        <Container className="" size="xs">
          <CallToAction
            callToAction={{
              title: t("ctaTitle"),
              description: t("ctaDescription"),
              variant: "secondary",
              button1: {
                title: "Submit a report",
                link: "/anonymous-reports",
              },
              button2: {
                title: "Create a deployment",
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
