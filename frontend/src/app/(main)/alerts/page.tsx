"use client";

import Container from "@/components/common/container";
import TextComponent from "@/components/common/text-component";
import AlertSubscriptionForm from "@/components/alerts/alert-subscription-form";
import CallToAction from "@/components/common/call-to-action";
import { useTranslations } from "next-intl";

const AlertsPage = () => {
  const t = useTranslations("Alerts");

  return (
    <>
      <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white ">
        <Container size="xs" className="">
          <TextComponent className="text-sm ">
            {t("pageDescription")}
          </TextComponent>
        </Container>
      </section>
      <section className="py-8 ">
        <Container size={"xs"}>
          <div className="flex mx-auto">
            {/* <div className="w-full pe-20">
              <HeadingTwo className="mb-8">Report an incident</HeadingTwo>
              <TextComponent className="mb-20">
                Your report is the first step toward a more just civic space.
                Use this form to securely and anonymously document an event.
                Every detail you provide helps us build a stronger case for
                change.
              </TextComponent>
              <H4 className="">Terms of Anonymous Submission</H4>{" "}
              <TextComponent>
                <p className="italic py-4">
                  By submitting a report via this anonymous channel, you agree
                  to and acknowledge the following terms.
                </p>
                <ul className="list-disc ps-6 mb-6">
                  <li>
                    The information provided is unverified and is not
                    attributable to a specific individual.
                  </li>
                  <li>
                    Watchtower shall not be held liable for any action or
                    inaction resulting from an anonymous submission.
                  </li>
                  <li>
                    Due to the nature of this reporting method, we cannot
                    guarantee a response or provide updates on the report's
                    status.
                  </li>
                  <li>
                    All submitted data is subject to the platform's standard{" "}
                    <span className="text-primary underline">terms of use</span>
                    .
                  </li>
                </ul>
              </TextComponent>
            </div> */}
            <AlertSubscriptionForm />
          </div>
        </Container>
      </section>
      <section className="pb-20 pt-10">
        <Container size="xs">
          <CallToAction
            color="primary"
            callToAction={{
              title: t("ctaTitle"),
              description: t("ctaDescription"),
              variant: "secondary",
              button1: {
                title: t("ctaButton1"),
                link: "/register-organization",
              },
              button2: {
                title: t("ctaButton2"),
                link: "/maps",
              },
            }}
          />
        </Container>
      </section>
    </>
  );
};

export default AlertsPage;
