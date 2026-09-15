"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { CaseStudyBlock } from "../data/placeholder-case-studies";

const BodyBlock = ({ block }: { block: CaseStudyBlock }) => {
  const t = useTranslations("CaseStudiesPage");

  switch (block.type) {
    case "heading":
      return (
        <h2 className="mt-8 font-title text-2xl font-medium text-dark first:mt-0 md:text-3xl">
          {block.text}
        </h2>
      );
    case "subheading":
      return <h3 className="-mb-2 font-title font-semibold text-dark md:text-lg">{block.text}</h3>;
    case "paragraph":
      return <p>{block.text}</p>;
    case "quote":
      return (
        <blockquote className="my-6 border-l-[6px] border-primary ps-5 font-title text-2xl italic leading-tight text-dark md:text-3xl">
          &ldquo;{block.text}&rdquo;
        </blockquote>
      );
    case "image":
      return (
        <div className="relative my-4 aspect-7/4 w-full overflow-hidden bg-dark/5 md:w-4/5">
          <Image src={block.src} alt={block.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>
      );
    case "stats":
      return (
        <dl className="my-8 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-border py-10 md:grid-cols-4">
          {block.items.map((item) => (
            <div key={item.label} className="flex flex-col-reverse gap-2">
              <dt className="text-dark/60">{item.label}</dt>
              <dd className="font-title text-4xl font-semibold text-dark md:text-5xl">
                {item.value}
                {item.unit && <span className="ms-2 text-2xl md:text-3xl">{item.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "mapLink":
      return (
        <Link
          href={block.href}
          className="mt-4 inline-flex w-fit items-center gap-1 font-title text-sm font-medium uppercase tracking-wide text-primary hover:text-primary/80"
        >
          {t("exploreOnMap")}
          <ArrowRight className="size-3.5" />
        </Link>
      );
  }
};

const CaseStudyArticle = ({ blocks }: { blocks: CaseStudyBlock[] }) => (
  <div className="flex flex-col gap-4 leading-snug text-dark/60 md:text-lg">
    {blocks.map((block, index) => (
      <BodyBlock key={index} block={block} />
    ))}
  </div>
);

export default CaseStudyArticle;
