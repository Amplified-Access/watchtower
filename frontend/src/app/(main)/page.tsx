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
import AnimatedIconCard from "@/components/common/animated-icon-card";
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
              <span className="block">{t("heroTitleLine1")}</span>
              <span className="block">{t("heroTitleLine2")}</span>
            </h1>
            <TextComponent className="max-w-3xl">
              {t("heroDescription")}
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
                {t("startReporting")}
              </Link>
              <Link
                href={"/maps"}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                  }),
                  "font-title font-medium",
                )}
              >
                {t("viewMaps")}
              </Link>
            </div>
          </Container>
        </div>
      </section>
      <section className="">
        <Container size="xs">
          <HeadingTwo className="pb-8 md:pb-14 text-center">
            {t("howItWorks")}
          </HeadingTwo>
          <div className="grid md:grid-cols-3 gap-6 relative isolate">
            {/* Horizontal dashed line behind cards (desktop), vertical on mobile) */}
            {/* <div className="border-b border-dark/40 absolute md:w-full top-1/2 -translate-y-1/2 -z-1 border-dashed" /> */}
            {/* <div className="border-r md:hidden border-dark/40 absolute h-full right-1/2  -translate-x-1/2 -z-1 border-dashed" /> */}
            {[
              {
                icon: ClipboardList,
                title: t("step1Title"),
                description: t("step1Description"),
              },
              {
                icon: Loader,
                title: t("step2Title"),
                description: t("step2Description"),
              },
              {
                icon: Blocks,
                title: t("step3Title"),
                description: t("step3Description"),
              },
            ].map((item, idx) => (
              <AnimatedIconCard
                key={idx}
                text={item.title}
                icon={item.icon}
                number={idx + 1}
              />
            ))}
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
      <section className="pb-16 md:pb-20">
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
