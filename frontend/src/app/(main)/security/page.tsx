import Container from "@/components/common/container";
import Footer from "@/components/layout/footer/page";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Security");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const section = "mb-10";
const h2 = "font-title font-semibold text-2xl text-dark mb-3";
const p = "text-dark/70 text-base md:text-lg leading-relaxed mb-4";
const ul = "list-disc pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4";

export default async function SecurityPage() {
  const t = await getTranslations("Security");

  return (
    <>
      {/* Hero */}
      <section className="relative bg-dark text-background py-24">
        <div className="h-32 bg-linear-to-b from-transparent to-dark/10 w-full absolute bottom-0" />
        <Container size="text" className="text-center flex flex-col gap-4">
          <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">
            {t("badge")}
          </p>
          <h1 className="font-title font-semibold text-4xl lg:text-5xl leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <Container size="text">
          {/* Intro */}
          <div className={section}>
            <p className={p}>{t("intro")}</p>
          </div>

          {/* Reporting */}
          <div className={section}>
            <h2 className={h2}>{t("reportingTitle")}</h2>
            <p className={p}>
              <strong>{t("reportingWarning")}</strong>
            </p>
            <p className={p}>{t("reportingInstruction")}</p>
            <ul className={ul}>
              <li>
                <a
                  href="mailto:noble@amplifiedaccess.org"
                  className="text-primary underline hover:opacity-80 transition-opacity"
                >
                  noble@amplifiedaccess.org
                </a>
              </li>
              <li>
                <a
                  href="mailto:aziz@amplifiedaccess.org"
                  className="text-primary underline hover:opacity-80 transition-opacity"
                >
                  aziz@amplifiedaccess.org
                </a>
              </li>
            </ul>
            <p className={p}>
              {t.rich("reportingResponseTime", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>

          {/* What to include */}
          <div className={section}>
            <h2 className={h2}>{t("whatToIncludeTitle")}</h2>
            <p className={p}>{t("whatToIncludeIntro")}</p>
            <ul className={ul}>
              <li>{t("includeItem1")}</li>
              <li>{t("includeItem2")}</li>
              <li>{t("includeItem3")}</li>
              <li>{t("includeItem4")}</li>
              <li>{t("includeItem5")}</li>
              <li>{t("includeItem6")}</li>
              <li>{t("includeItem7")}</li>
            </ul>
          </div>

          {/* Disclosure policy */}
          <div className={section}>
            <h2 className={h2}>{t("disclosureTitle")}</h2>
            <p className={p}>
              {t.rich("disclosurePolicy", {
                link: (chunks) => (
                  <a
                    href="https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:opacity-80 transition-opacity"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
            <p className={p}>{t("disclosureFollowUp")}</p>
          </div>

          {/* Preferred language */}
          <div className={section}>
            <h2 className={h2}>{t("languageTitle")}</h2>
            <p className={p}>
              {t.rich("languageText", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
