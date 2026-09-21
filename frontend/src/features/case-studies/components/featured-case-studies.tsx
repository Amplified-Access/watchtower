"use client";

import { useTranslations } from "next-intl";
import CaseStudyCard from "./case-study-card";
import { FEATURED_CASE_STUDIES } from "../data/placeholder-case-studies";

const FeaturedCaseStudies = () => {
  const t = useTranslations("CaseStudiesPage");

  if (FEATURED_CASE_STUDIES.length === 0) return null;

  return (
    <div className="border-b border-border pb-16 md:pb-24">
      <h2 className="font-title text-3xl font-semibold text-dark md:text-4xl">
        {t("featuredTitle")}
      </h2>
      <div className="mt-10 grid gap-x-7 gap-y-16 md:mt-12 md:grid-cols-2 md:gap-y-20">
        {FEATURED_CASE_STUDIES.map((caseStudy) => (
          <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCaseStudies;
