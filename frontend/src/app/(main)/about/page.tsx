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
import { MoveRight, Globe, Target, Users } from "lucide-react";

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

const GoalCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col gap-4 p-6 rounded-2xl border border-dark/10 bg-white hover:shadow-sm transition-shadow">
    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
      <Icon size={18} className="text-primary" />
    </div>
    <h3 className="font-title font-semibold text-dark text-lg">{title}</h3>
    <p className="text-sm text-dark/60 leading-relaxed">{description}</p>
  </div>
);

const languages = [
  { name: "English", region: "Global", code: "en" },
  { name: "Amharic", region: "Ethiopia", code: "am" },
  { name: "French", region: "West & Central Africa", code: "fr" },
  { name: "Kikuyu", region: "Kenya", code: "ki" },
  { name: "Luganda", region: "Uganda", code: "lg" },
  { name: "Punjabi", region: "South Asia", code: "pa" },
  { name: "Kinyarwanda", region: "Rwanda", code: "rw" },
  { name: "Sukuma", region: "Tanzania", code: "suk" },
  { name: "Swahili", region: "East Africa", code: "sw" },
  { name: "Urdu", region: "Pakistan", code: "ur" },
];

const Page = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative">
        <Image
          src="/topographic.svg"
          alt=""
          width={500}
          height={500}
          className="w-full object-cover h-full absolute top-0 -z-1 opacity-20"
        />
        <div className="h-32 bg-linear-to-b from-transparent to-background w-full absolute bottom-0" />
        <div className="py-40 2xl:py-48">
          <Container className="pt-16 flex flex-col gap-6 text-center items-center">
            <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">
              About WatchTower
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold font-title leading-tight max-w-2xl">
              Building tools for civic accountability
            </h1>
            <TextComponent className="max-w-2xl">
              We believe everyone deserves a voice in their community, regardless
              of the language they speak. WatchTower bridges that gap — turning
              local reports into meaningful change.
            </TextComponent>
          </Container>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 md:py-24 bg-dark text-background">
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
            because reporting tools don't speak people's languages. WatchTower
            removes that barrier so that everyone can participate in public
            accountability.
          </p>
        </Container>
      </section>

      {/* What We're Trying to Achieve */}
      <section className="py-16 md:py-24">
        <Container size="xs">
          <div className="text-center mb-12">
            <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm mb-4">
              What We&apos;re Trying to Achieve
            </p>
            <HeadingTwo className="text-center">
              Three goals, one platform
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              Every feature we build serves one of these three purposes.
            </TextComponent>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <GoalCard
              icon={Globe}
              title="Accessible reporting"
              description="Make it possible for anyone to submit a civic incident report in the language they're most comfortable with — no translation required."
            />
            <GoalCard
              icon={Target}
              title="Transparent accountability"
              description="Surface patterns, trends, and hotspots from ground-level reports so communities, journalists, and organisations can build evidence-based cases."
            />
            <GoalCard
              icon={Users}
              title="Community-led change"
              description="Put verified data in the hands of the communities it belongs to, so they can advocate for themselves and hold decision-makers accountable."
            />
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-background">
        <Container size="xs">
          <div className="text-center mb-14 md:mb-20">
            <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm mb-4">
              How It Works
            </p>
            <HeadingTwo className="text-center">
              From a single report to system-wide change
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              Here is how WatchTower enables communities to make their voices
              heard and drive meaningful change.
            </TextComponent>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Visual */}
            <div className="flex justify-center">
              <div className="relative size-72 md:size-80 rounded-full bg-dark overflow-hidden flex items-center justify-center">
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

            {/* Steps */}
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-16 w-px bg-dark/15" />
              <StepCard
                icon={ClipboardList}
                part="Step 1"
                title="Report"
                description="Anyone with a phone or computer can submit a civic incident report directly in their own language — from election irregularities to infrastructure failures and rights violations."
              />
              <StepCard
                icon={Loader}
                part="Step 2"
                title="Analyse"
                description="We process and verify every report, mapping incidents and surfacing patterns that would otherwise go unnoticed. Raw information becomes clear, structured intelligence."
              />
              <StepCard
                icon={Blocks}
                part="Step 3"
                title="Act"
                description="Communities, organisations, and institutions access these insights to build cases, hold the right people accountable, and push for meaningful change backed by real evidence."
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Languages */}
      <section className="py-16 md:py-24 bg-primary">
        <Container size="xs">
          <div className="text-center mb-12">
            <p className="text-white/60 font-title font-semibold uppercase tracking-widest text-sm mb-4">
              Languages Available
            </p>
            <h2 className="font-title font-semibold text-3xl md:text-4xl text-white leading-tight">
              Speak your language
            </h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto">
              WatchTower currently supports {languages.length} languages — with
              more added as we expand into new communities.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col gap-1 text-center hover:bg-white/20 transition-colors"
              >
                <span className="font-title font-semibold text-white text-sm">
                  {lang.name}
                </span>
                <span className="text-white/55 text-xs">{lang.region}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Map */}
      <section className="py-16 md:py-24">
        <Container size="xs">
          <div className="text-center mb-10">
            <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm mb-4">
              Where We Operate
            </p>
            <HeadingTwo className="text-center">
              Incidents mapped in real time
            </HeadingTwo>
            <TextComponent className="mt-4 max-w-2xl mx-auto text-center">
              Explore community-reported issues across locations as they happen
              — all on a single interactive map.
            </TextComponent>
          </div>
          <Link href="/maps/live-incident-map" className="group block">
            <div className="relative rounded-2xl overflow-hidden border border-dark/10">
              <Image
                src="/images/live-incident-map.png"
                alt="Live incident map"
                width={1200}
                height={700}
                className="w-full object-cover aspect-video"
                draggable={false}
              />
              <div className="absolute inset-0 bg-dark/30 group-hover:bg-dark/20 transition-colors flex items-center justify-center">
                <span
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "font-title font-medium gap-2 pointer-events-none",
                  )}
                >
                  View live map
                  <MoveRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <Container size="xs">
          <CallToAction
            callToAction={{
              title: "Get in touch",
              description:
                "Have a question, want to partner with us, or just want to learn more about what WatchTower can do for your community? We'd love to hear from you.",
              variant: "secondary",
              button1: {
                title: "Email us",
                link: "mailto:hello@amplifiedaccess.org",
              },
              button2: {
                title: "Submit a report",
                link: "/anonymous-reports",
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
