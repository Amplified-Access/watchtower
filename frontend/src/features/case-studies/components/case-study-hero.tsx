"use client";

import Image from "next/image";
import type { CaseStudy } from "../data/placeholder-case-studies";
import { useCategoryLabel } from "../hooks/use-category-label";

// Grid hero with the title block beside the cover image, in a panel that stops
// at the page gutters like the listing hero.
const CaseStudyHero = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const categoryLabel = useCategoryLabel();
  const meta = [caseStudy.location, categoryLabel(caseStudy.category), caseStudy.deployment]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
      {/* Grid panel stops at the gutters the rest of the page runs its rails
          down, rather than bleeding to the viewport edge. Matches the listing. */}
      <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
        <div className="relative isolate overflow-hidden border-b border-border bg-[#f4f4f4]">
          {/* Radial mask so the grid reads through the middle and falls away at
              the edges instead of tiling flat across the whole panel. */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(0_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.06)_1px,transparent_1px)] bg-size-[46px_46px] mask-[radial-gradient(ellipse_at_center,black_10%,transparent_75%)]" />
          <div className="grid items-center gap-10 px-4 pt-24 pb-12 md:px-8 md:pt-28 md:pb-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div>
              <span aria-hidden className="block h-1.5 w-16 bg-primary" />
              <h1 className="mt-2 max-w-xl font-title text-3xl font-medium text-dark md:text-4xl">
                {caseStudy.title}
              </h1>
              <p className="mt-6 max-w-md leading-snug text-dark/60 md:text-lg">
                {caseStudy.summary}
              </p>
              <p className="mt-6 max-w-sm font-title font-semibold leading-snug text-dark md:mt-8 md:text-lg">
                {meta}
              </p>
            </div>
            <div className="relative aspect-7/4 overflow-hidden bg-dark/5">
              <Image
                src={caseStudy.imageUrl}
                alt={caseStudy.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudyHero;
