"use client";

import { useTranslations } from "next-intl";
import type { CaseStudy } from "../data/placeholder-case-studies";
import CaseStudyCard from "./case-study-card";

const RelatedCaseStudies = ({ caseStudies }: { caseStudies: CaseStudy[] }) => {
  const t = useTranslations("CaseStudiesPage");
  if (caseStudies.length === 0) return null;

  return (
    <div>
      <h2 className="font-title text-lg font-medium uppercase tracking-wide text-primary md:text-xl">
        {t("relatedCaseStudies")}
      </h2>
      <div className="mt-8 grid gap-x-7 gap-y-16 md:grid-cols-2">
        {caseStudies.map((caseStudy) => (
          <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
};

export default RelatedCaseStudies;
