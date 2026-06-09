import Container from "@/components/common/container";
import HeadingFour from "@/components/common/heading-four";
import HeadingOne from "@/components/common/heading-one";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import Image from "next/image";
import Link from "next/link";
import H3 from "@/components/common/heading-three";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CallToAction from "@/components/common/call-to-action";
import { ArrowRight, MoveRight } from "lucide-react";
import DynamicThematicMaps from "@/features/maps/components/dynamic-thematic-maps";

const Page = () => {
  return (
    <>
      <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white ">
        <Container size="xs" className="">
          <TextComponent className="text-sm ">
            Navigate our live interactive maps to explore community-reported issues across locations and over time.
          </TextComponent>
        </Container>
      </section>
      <section className=" pb-20 pt-8 bg-white">
        <Container size="xs" className="flex items-center pt-10">
          <div className="w-full">
            <H3 className="text-center pb-8">Live incident map</H3>
            <Link href={"/maps/live-incident-map"} className="">
              <div className="relative isolate group">
                <Image
                  src={"/images/live-incident-map.png"}
                  alt={""}
                  width={1000}
                  height={700}
                  className="aspect-wideo rounded-lg w-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="flex justify-center pt-8 md:pt-0">
                <Button size={"lg"} className="hover:scale-105">
                  <span>Go to map</span>
                  <MoveRight size={16} />
                </Button>
              </div>
            </Link>
          </div>
          {/* <div className=" w-1/2 px-20">
            <H3 >Live incident map</H3>
            <TextComponent className="pt-8 pb-12">
              View events in real-time as they are
              documented by users. See where incidents are occurring and how
              they are affecting communities on the ground. This map helps
              everyone understand what's happening and where help is needed.
            </TextComponent>
            <Link
              href={""}
              className={cn(buttonVariants({ variant: "default", size:"lg" }))}
            >
              Go to map
            </Link>
          </div> */}
        </Container>
      </section>

      {/* Dynamic Thematic Maps Section */}
      <DynamicThematicMaps />

      <section className="pb-20">
        <Container size="xs">
          <CallToAction
            callToAction={{
              title: "Dig deeper",
              description:
                "Ask questions through our chat assistant or sign up for timely alerts and updates to stay informed on emerging issues or trends.",
              variant: "secondary",
              button1: {
                title: "Chat with Esi",
                link: "/chat",
              },
              button2: {
                title: "Signup for alerts",
                link: "/alerts",
              },
            }}
            color="primary"
          />
        </Container>
      </section>
    </>
  );
};

export default Page;
