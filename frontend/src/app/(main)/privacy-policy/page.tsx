import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import Footer from "@/components/layout/footer/page";
import PolicySections from "@/features/legal/components/policy-sections";
import PolicyToc from "@/features/legal/components/policy-toc";
import { getLegalPage } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// The title and the policy text are the `privacyPolicy` document in Sanity;
// the "Last updated" and contents labels are UI copy in messages/*.json. The
// header is just the title and the date, styled like the other pages' headers.
// The text is only translated once a reviewed translation exists — until then
// each section falls back to English.
const Page = async () => {
  const locale = await getLocale();
  const [t, tBanner, policy] = await Promise.all([
    getTranslations("PrivacyPolicyPage"),
    getTranslations("AnnouncementBanner"),
    getLegalPage("privacyPolicy", locale),
  ]);
  const sections = policy?.sections ?? [];
  // Untitled (introductory) sections aren't listed in the contents.
  const tocItems = sections.flatMap(({ id, title, titleLanguage }) =>
    title ? [{ id, title, lang: titleLanguage !== locale ? titleLanguage : undefined }] : [],
  );

  const lastUpdated =
    policy?.lastUpdated &&
    new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(policy.lastUpdated));

  return (
    <>
      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>

        <div className="border-b border-border">
          <div className="mx-auto max-w-3xl px-8 pt-40 pb-16 text-center md:pt-44 md:pb-20">
            <h1 className="font-title text-4xl font-semibold leading-tight text-dark">
              {policy?.hero.title}
            </h1>
            {lastUpdated && (
              <p className="mx-auto mt-4 max-w-lg text-dark/60 leading-snug">
                {t("lastUpdated", { date: lastUpdated })}
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-360 px-4 md:px-8 lg:grid-cols-[18rem_1fr] xl:grid-cols-[20rem_1fr] xl:px-16">
          <aside className="border-b border-border lg:border-r lg:border-b-0">
            <div className="lg:sticky lg:top-32">
              <PolicyToc label={t("onThisPage")} items={tocItems} />
            </div>
          </aside>
          <div className="px-6 py-12 md:px-12 md:py-16 xl:px-24">
            <div className="max-w-3xl">
              <PolicySections sections={sections} locale={locale} />
            </div>
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
      {/* Refreshes the policy for open readers when it is published. */}
      <SanityLive />
    </>
  );
};

export default Page;
