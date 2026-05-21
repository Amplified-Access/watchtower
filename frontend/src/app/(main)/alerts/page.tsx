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
