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
      <Container size="xs" className="flex flex-col gap-8">
        <HeadingTwo className="mb-2">{t("pageTitle")}</HeadingTwo>
        <TextComponent className="mb-4 max-w-2xl">{t("pageIntro")}</TextComponent>
        <AnonymousIncidentReportForm />
        <div className="mt-8">
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
      </Container>
    </section>
  );
};

export default Page;
