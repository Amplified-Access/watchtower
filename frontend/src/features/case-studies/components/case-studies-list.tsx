"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
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

const PAGE_SIZE = 6;

const LOCATIONS = [...new Set(LISTED_CASE_STUDIES.map((c) => c.location))].sort();

// 1 2 3 4 5 … 21 near the start, 1 … 9 10 11 … 21 in the middle, etc.
const getPageItems = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
};

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
  const listRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CASE_STUDY_CATEGORIES),
  );
  const [location, setLocation] = useQueryState("location", parseAsString);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const filtered = LISTED_CASE_STUDIES.filter(
    (c) => (!category || c.category === category) && (!location || c.location === location),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Filter changes go back to page 1 (null drops the param from the URL).
  const selectCategory = (value: typeof category) => {
    setCategory(value);
    setPage(null);
  };
  const selectLocation = (value: string | null) => {
    setLocation(value);
    setPage(null);
  };
  const goToPage = (value: number) => {
    setPage(value === 1 ? null : value);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={listRef} className="scroll-mt-40">
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

      {totalPages > 1 && (
        <nav
          aria-label={t("pagination")}
          className="mt-16 flex items-center justify-center gap-1 md:mt-24"
        >
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t("previousPage")}
            className="flex size-9 items-center justify-center rounded-full border border-dark/10 text-dark transition-colors hover:bg-dark/5 disabled:border-transparent disabled:bg-dark/5 disabled:text-dark/30"
          >
            <ChevronLeft className="size-4" />
          </button>
          {getPageItems(currentPage, totalPages).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} aria-hidden className="w-8 text-center text-sm text-dark/60">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                aria-label={t("pageLabel", { number: item })}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                  item === currentPage
                    ? "bg-primary text-white"
                    : "text-dark hover:bg-dark/5",
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t("nextPage")}
            className="flex size-9 items-center justify-center rounded-full border border-dark/10 text-dark transition-colors hover:bg-dark/5 disabled:border-transparent disabled:bg-dark/5 disabled:text-dark/30"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default CaseStudiesList;
