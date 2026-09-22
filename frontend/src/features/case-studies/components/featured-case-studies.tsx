"use client";

import { useTranslations } from "next-intl";
import CaseStudyCard from "./case-study-card";
import {
  FEATURED_CASE_STUDIES,
  type CaseStudy,
} from "../data/placeholder-case-studies";

const FeaturedCaseStudies = () => {
  const t = useTranslations("CaseStudiesPage");

  if (FEATURED_CASE_STUDIES.length === 0) return null;

  const pairs: [CaseStudy, CaseStudy | undefined][] = [];
  for (let i = 0; i < FEATURED_CASE_STUDIES.length; i += 2) {
    pairs.push([FEATURED_CASE_STUDIES[i], FEATURED_CASE_STUDIES[i + 1]]);
  }

  return (
    <div className="border-b border-border pb-16 md:pb-24">
      <h2 className="font-title text-3xl font-semibold text-dark md:text-4xl">
        {t("featuredTitle")}
      </h2>
      {/* Studies pair up: a wide lead card and a narrow side card. On md both
          cards span a subgrid image row and text row, so their images align.
          From xl the whole side card fits beside the lead image: the columns
          split 2:1 and the lead image is 7:4, so a 7:8 side card is exactly
          as tall, and its image shrinks to leave room for the text. */}
      <div className="mt-10 flex flex-col gap-16 md:mt-12 md:gap-20">
        {pairs.map(([lead, side]) => (
          <div
            key={lead.slug}
            className="grid gap-x-7 gap-y-16 md:grid-cols-2 md:gap-y-0 xl:grid-cols-[2fr_1fr]"
          >
            <CaseStudyCard
              caseStudy={lead}
              className="md:row-span-2 md:grid md:grid-rows-subgrid md:gap-y-0"
              sizes="(min-width: 1280px) 66vw, (min-width: 768px) 50vw, 100vw"
            />
            {side && (
              <CaseStudyCard
                caseStudy={side}
                className="md:row-span-2 md:grid md:grid-rows-subgrid md:gap-y-0 xl:row-span-1 xl:flex xl:aspect-7/8 xl:self-start"
                imageClassName="md:aspect-auto xl:min-h-24 xl:flex-1"
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCaseStudies;
