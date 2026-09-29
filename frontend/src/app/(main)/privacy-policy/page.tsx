import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import Footer from "@/components/layout/footer/page";
import PolicySections from "@/features/legal/components/policy-sections";
import PolicyToc from "@/features/legal/components/policy-toc";
import { getLegalPage } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// The page header is UI copy in messages/*.json; the policy text is edited in
// Sanity (the `privacyPolicy` document). It is only translated once a reviewed
// translation exists — until then each section falls back to English.
const Page = async () => {
  const locale = await getLocale();
  const [t, tBanner, policy] = await Promise.all([
    getTranslations("PrivacyPolicyPage"),
    getTranslations("AnnouncementBanner"),
    getLegalPage("privacyPolicy", locale),
  ]);
  const sections = policy?.sections ?? [];
  const tocItems = sections.map(({ id, title, titleLanguage }) => ({
    id,
    title,
    lang: titleLanguage !== locale ? titleLanguage : undefined,
  }));

  const lastUpdated =
    policy &&
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
            <p className="mb-4 font-title text-sm font-medium uppercase tracking-wide text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="font-title text-4xl font-medium leading-tight text-dark md:text-6xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-dark leading-snug md:text-lg">{t("intro")}</p>
            {lastUpdated && (
              <p className="mt-10 font-title font-semibold text-dark md:text-lg">
                {t("lastUpdated", { date: lastUpdated })}
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-360 px-4 md:px-8 lg:grid-cols-[18rem_1fr] xl:grid-cols-[20rem_1fr] xl:px-16">
          <aside className="border-b border-border lg:border-r lg:border-b-0">
            <div className="lg:sticky lg:top-32">
              <PolicyToc label={t("inThisPolicy")} items={tocItems} />
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
