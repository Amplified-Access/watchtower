"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Check } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CaseStudyCard from "./case-study-card";
import { useCategoryLabel } from "../hooks/use-category-label";
import {
  CASE_STUDY_CATEGORIES,
  LISTED_CASE_STUDIES,
} from "../data/placeholder-case-studies";

// Four to start and four more per "Load more", like the thematic maps list.
const PAGE_SIZE = 4;

const LOCATIONS = [...new Set(LISTED_CASE_STUDIES.map((c) => c.location))].sort();

const chipClassName = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-2 border px-4 font-title text-sm transition-colors md:h-11 md:text-base",
    active
      ? "border-dark bg-dark text-white"
      : "border-dark/10 bg-dark/[0.03] text-dark hover:bg-dark/[0.07]",
  );

const CaseStudiesList = () => {
  const t = useTranslations("CaseStudiesPage");
  const categoryLabel = useCategoryLabel();

  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CASE_STUDY_CATEGORIES),
  );
  const [location, setLocation] = useQueryState("location", parseAsString);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = LISTED_CASE_STUDIES.filter(
    (c) => (!category || c.category === category) && (!location || c.location === location),
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // A filter change starts the list over at the first four.
  const selectCategory = (value: typeof category) => {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  };
  const selectLocation = (value: string | null) => {
    setLocation(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 md:gap-2.5">
        <button
          type="button"
          onClick={() => selectCategory(null)}
          aria-pressed={!category}
          className={chipClassName(!category)}
        >
          {t("filterAll")}
        </button>
        {CASE_STUDY_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectCategory(category === value ? null : value)}
            aria-pressed={category === value}
            className={chipClassName(category === value)}
          >
            {categoryLabel(value)}
          </button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger className={chipClassName(!!location)}>
            {location ?? t("moreFilters")}
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel>{t("location")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => selectLocation(null)}>
              <Check className={cn("size-4", location && "invisible")} />
              {t("allLocations")}
            </DropdownMenuItem>
            {LOCATIONS.map((value) => (
              <DropdownMenuItem key={value} onSelect={() => selectLocation(value)}>
                <Check className={cn("size-4", location !== value && "invisible")} />
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-dark/60">{t("empty")}</p>
          <button
            type="button"
            onClick={() => {
              selectCategory(null);
              selectLocation(null);
            }}
            className="mt-4 font-title text-sm font-medium uppercase tracking-wide text-primary hover:text-primary/80"
          >
            {t("clearFilters")}
          </button>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-7 gap-y-16 md:mt-20 md:grid-cols-2 md:gap-y-20">
          {visible.map((caseStudy) => (
            <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-16 flex justify-center md:mt-24">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "font-title font-medium",
            )}
          >
            {t("loadMore")}
            <ChevronDown />
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseStudiesList;
