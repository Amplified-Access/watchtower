import Container from "@/components/common/container";
import Footer from "@/components/layout/footer/page";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CodeOfConduct");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const section = "mb-10";
const h2 = "font-title font-semibold text-2xl text-dark mb-3";
const h3 = "font-title font-semibold text-lg text-dark mb-2 mt-6";
const p = "text-dark/70 text-base md:text-lg leading-relaxed mb-4";
const ul = "list-disc pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4";

export default async function CodeOfConductPage() {
  const t = await getTranslations("CodeOfConduct");

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
          {/* Our Pledge */}
          <div className={section}>
            <h2 className={h2}>{t("pledgeTitle")}</h2>
            <p className={p}>{t("pledgeText1")}</p>
            <p className={p}>{t("pledgeText2")}</p>
          </div>

          {/* Our Standards */}
          <div className={section}>
            <h2 className={h2}>{t("standardsTitle")}</h2>
            <p className={p}>{t("standardsPositiveIntro")}</p>
            <ul className={ul}>
              <li>{t("standardsPositive1")}</li>
              <li>{t("standardsPositive2")}</li>
              <li>{t("standardsPositive3")}</li>
              <li>{t("standardsPositive4")}</li>
              <li>{t("standardsPositive5")}</li>
            </ul>
            <p className={p}>{t("standardsNegativeIntro")}</p>
            <ul className={ul}>
              <li>{t("standardsNegative1")}</li>
              <li>{t("standardsNegative2")}</li>
              <li>{t("standardsNegative3")}</li>
              <li>{t("standardsNegative4")}</li>
              <li>{t("standardsNegative5")}</li>
            </ul>
          </div>

          {/* Enforcement Responsibilities */}
          <div className={section}>
            <h2 className={h2}>{t("enforcementResponsibilitiesTitle")}</h2>
            <p className={p}>{t("enforcementResponsibilitiesText1")}</p>
            <p className={p}>{t("enforcementResponsibilitiesText2")}</p>
          </div>

          {/* Scope */}
          <div className={section}>
            <h2 className={h2}>{t("scopeTitle")}</h2>
            <p className={p}>{t("scopeText")}</p>
          </div>

          {/* Enforcement */}
          <div className={section}>
            <h2 className={h2}>{t("reportingTitle")}</h2>
            <p className={p}>{t("reportingIntro")}</p>
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
            <p className={p}>{t("reportingFollowUp")}</p>
          </div>

          {/* Enforcement Guidelines */}
          <div className={section}>
            <h2 className={h2}>{t("guidelinesTitle")}</h2>
            <p className={p}>{t("guidelinesIntro")}</p>

            <h3 className={h3}>{t("correctionTitle")}</h3>
            <p className={p}>
              <strong>{t("correctionImpactLabel")}</strong>{" "}
              {t("correctionImpactText")}
            </p>
            <p className={p}>
              <strong>{t("correctionConsequenceLabel")}</strong>{" "}
              {t("correctionConsequenceText")}
            </p>

            <h3 className={h3}>{t("warningTitle")}</h3>
            <p className={p}>
              <strong>{t("warningImpactLabel")}</strong>{" "}
              {t("warningImpactText")}
            </p>
            <p className={p}>
              <strong>{t("warningConsequenceLabel")}</strong>{" "}
              {t("warningConsequenceText")}
            </p>

            <h3 className={h3}>{t("temporaryBanTitle")}</h3>
            <p className={p}>
              <strong>{t("temporaryBanImpactLabel")}</strong>{" "}
              {t("temporaryBanImpactText")}
            </p>
            <p className={p}>
              <strong>{t("temporaryBanConsequenceLabel")}</strong>{" "}
              {t("temporaryBanConsequenceText")}
            </p>

            <h3 className={h3}>{t("permanentBanTitle")}</h3>
            <p className={p}>
              <strong>{t("permanentBanImpactLabel")}</strong>{" "}
              {t("permanentBanImpactText")}
            </p>
            <p className={p}>
              <strong>{t("permanentBanConsequenceLabel")}</strong>{" "}
              {t("permanentBanConsequenceText")}
            </p>
          </div>

          {/* Attribution */}
          <div className={section}>
            <h2 className={h2}>{t("attributionTitle")}</h2>
            <p className={p}>
              {t.rich("attributionText", {
                covenantLink: (chunks) => (
                  <a
                    href="https://www.contributor-covenant.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:opacity-80 transition-opacity"
                  >
                    {chunks}
                  </a>
                ),
                versionLink: (chunks) => (
                  <a
                    href="https://www.contributor-covenant.org/version/2/1/code_of_conduct/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:opacity-80 transition-opacity"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
