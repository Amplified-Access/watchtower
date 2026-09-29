"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import SanityImage from "@/components/common/sanity-image";
import type { CaseStudyBodyBlock, SanityImage as SanityImageData } from "@/lib/sanity/types";

type StatsBlock = Extract<CaseStudyBodyBlock, { _type: "stats" }>;

const MapLink = ({ href }: { href: string }) => {
  const t = useTranslations("CaseStudiesPage");
  return (
    <Link
      href={href}
      className="mt-4 inline-flex w-fit items-center gap-1 font-title text-sm font-medium uppercase tracking-wide text-primary hover:text-primary/80"
    >
      {t("exploreOnMap")}
      <ArrowRight className="size-3.5" />
    </Link>
  );
};

// The write-up's Portable Text, styled as the Figma body: headings, a pull
// quote, full-width figures and inline images. Block types match
// src/sanity/schemaTypes/caseStudyBody.ts.
const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 font-title text-2xl font-medium text-dark first:mt-0 md:text-3xl">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="-mb-2 font-title font-semibold text-dark md:text-lg">{children}</h3>,
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-[6px] border-primary ps-5 font-title text-2xl italic leading-tight text-dark md:text-3xl">
        &ldquo;{children}&rdquo;
      </blockquote>
    ),
  },
  marks: {
    link: ({ value, children }) => (
      <a href={value?.href} className="text-primary underline underline-offset-2">
        {children}
      </a>
    ),
  },
  types: {
    bodyImage: ({ value }: { value: SanityImageData }) => (
      <div className="relative my-4 aspect-7/4 w-full overflow-hidden bg-dark/5 md:w-4/5">
        <SanityImage image={value} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
      </div>
    ),
    stats: ({ value }: { value: StatsBlock }) => (
      <dl className="my-8 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-border py-10 md:grid-cols-4">
        {value.items.map((item) => (
          <div key={item._key} className="flex flex-col-reverse justify-end gap-2">
            <dt className="text-dark/60">{item.label}</dt>
            <dd className="font-title text-4xl font-semibold text-dark md:text-5xl">
              {item.value}
              {item.unit && <span className="ms-2 text-2xl md:text-3xl">{item.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    ),
    mapLink: ({ value }: { value: { href: string } }) => <MapLink href={value.href} />,
  },
};

type CaseStudyArticleProps = {
  body: CaseStudyBodyBlock[];
  /** Set when the body is shown in another language than the page (an English fallback). */
  lang?: string;
};

const CaseStudyArticle = ({ body, lang }: CaseStudyArticleProps) => (
  <div lang={lang} className="flex flex-col gap-4 leading-snug text-dark/60 md:text-lg">
    <PortableText value={body} components={components} />
  </div>
);

export default CaseStudyArticle;
