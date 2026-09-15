"use client";

import { useTranslations } from "next-intl";
import type { CaseStudyCategory } from "../data/placeholder-case-studies";

const CATEGORY_MESSAGE_KEYS = {
  climate: "categoryClimate",
  "water-sanitation": "categoryWaterSanitation",
  "rights-safety": "categoryRightsSafety",
  "public-services": "categoryPublicServices",
} as const satisfies Record<CaseStudyCategory, string>;

export const useCategoryLabel = () => {
  const t = useTranslations("CaseStudiesPage");
  return (category: CaseStudyCategory) => t(CATEGORY_MESSAGE_KEYS[category]);
};
