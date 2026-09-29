import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Footer from "@/components/layout/footer/page";
import CaseStudyHero from "@/features/case-studies/components/case-study-hero";
import CaseStudyArticle from "@/features/case-studies/components/case-study-article";
import RelatedCaseStudies from "@/features/case-studies/components/related-case-studies";
import { getCaseStudy } from "@/lib/sanity/content";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug, await getLocale());
  return caseStudy ? { title: caseStudy.title, description: caseStudy.summary } : {};
}

const CaseStudyPage = async ({ params }: CaseStudyPageProps) => {
  const { slug } = await params;
  const locale = await getLocale();
  const caseStudy = await getCaseStudy(slug, locale);
  if (!caseStudy) notFound();

  const tBanner = await getTranslations("AnnouncementBanner");
  // Studies without a full write-up yet show their summary as the introduction.
  const body = caseStudy.body?.length
    ? caseStudy.body
    : [
        {
          _type: "block",
          _key: "summary",
          style: "normal",
          children: [{ _type: "span", _key: "summary", text: caseStudy.summary, marks: [] }],
          markDefs: [],
        },
      ];

  return (
    <>
      <CaseStudyHero caseStudy={caseStudy} />

      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <div className="mx-auto max-w-360 px-8 md:px-16 xl:px-28">
          <article className="mx-auto max-w-3xl py-12 md:py-16">
            {/* An untranslated body is shown in English: say so to screen
                readers and in-browser translation. */}
            <CaseStudyArticle
              body={body}
              lang={caseStudy.body?.length && caseStudy.bodyLanguage !== locale ? caseStudy.bodyLanguage : undefined}
            />
          </article>
          <div className="pt-12 pb-20 md:pt-20 md:pb-28">
            <RelatedCaseStudies caseStudies={caseStudy.related} />
          </div>
        </div>
      </section>

      <section className="relative isolate bg-primary py-4 text-white [zoom:var(--viewport-scale)]">
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-center text-sm font-medium md:px-8 xl:px-16">
          <span>{tBanner("message")}</span>
          <Link
            href="/anonymous-reports"
            className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
          >
            {tBanner("cta")}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CaseStudyPage;
