"use client";

import Container from "@/components/common/container";
import H4 from "@/components/common/heading-four";
import HeadingTwo from "@/components/common/heading-two";
import TextComponent from "@/components/common/text-component";
import AnonymousIncidentReportForm from "@/features/anonymous-reporting/components/anonymous-incident-report-form";
import { useTranslations } from "next-intl";

const Page = () => {
  const t = useTranslations("AnonymousReporting");

  return (
    <section className="mt-20 pt-20">
      <Container
        size="sm"
        className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-16"
      >
        <div className="w-full lg:max-w-[50%] pe-0 lg:pe-20">
          <HeadingTwo className="mb-8">{t("pageTitle")}</HeadingTwo>
          <TextComponent className="mb-20">{t("pageIntro")}</TextComponent>
          <H4 className="">{t("termsTitle")}</H4>{" "}
          <TextComponent>
            <p className="italic py-4">{t("termsIntro")}</p>
            <ul className="list-disc ps-6 mb-6">
              <li>{t("term1")}</li>
              <li>{t("term2")}</li>
              <li>{t("term3")}</li>
              <li>
                {t("term4")}{" "}
                <span className="text-primary underline">
                  {t("termsOfUse")}
                </span>
                .
              </li>
            </ul>
          </TextComponent>
        </div>
        <div className="w-full lg:max-w-[50%]">
          <AnonymousIncidentReportForm />
        </div>
      </Container>
    </section>
  );
};

export default Page;
