"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { CaseStudy } from "../data/placeholder-case-studies";
import { useCategoryLabel } from "../hooks/use-category-label";

// "08 Sep, 2026". Formatted in UTC so server and client render the same string.
const formatDate = (iso: string, locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")}, ${get("year")}`;
};

const CaseStudyCard = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const t = useTranslations("CaseStudiesPage");
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-7/4 overflow-hidden bg-dark/5">
        <Image
          src={caseStudy.imageUrl}
          alt={caseStudy.imageAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="truncate bg-dark/5 px-2 py-0.5 text-sm text-dark">
          {categoryLabel(caseStudy.category)} . {caseStudy.location}
        </span>
        <time
          dateTime={caseStudy.publishedAt}
          className="shrink-0 text-sm text-dark"
        >
          {formatDate(caseStudy.publishedAt, locale)}
        </time>
      </div>
      <h2 className="mt-4 font-title text-xl font-medium leading-tight text-dark md:text-2xl">
        {caseStudy.title}
      </h2>
      <p className="mt-3 max-w-lg text-dark/60 leading-snug">
        {caseStudy.summary}
      </p>
      {/* TODO: link to the case study detail page once it exists. */}
      <Link
        href="#"
        className="mt-4 inline-flex w-fit items-center gap-1 font-title text-sm font-medium uppercase tracking-wide text-primary hover:text-primary/80"
      >
        {t("readCaseStudy")}
        <ArrowRight className="size-3.5" />
      </Link>
    </article>
  );
};

export default CaseStudyCard;
