import Container from "@/components/common/container";
import Footer from "@/components/layout/footer/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Policy — WatchTower",
  description:
    "How to responsibly report security vulnerabilities to the AmplifiedAccess team.",
};

const section = "mb-10";
const h2 = "font-title font-semibold text-2xl text-dark mb-3";
const p = "text-dark/70 text-base md:text-lg leading-relaxed mb-4";
const ul = "list-disc pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4";

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-dark text-background py-24">
        <div className="h-32 bg-linear-to-b from-transparent to-dark/10 w-full absolute bottom-0" />
        <Container size="text" className="text-center flex flex-col gap-4">
          <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">
            Security
          </p>
          <h1 className="font-title font-semibold text-4xl lg:text-5xl leading-tight">
            Security Policy
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            How we handle vulnerability reports and our commitment to responsible
            disclosure.
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <Container size="text">
          {/* Intro */}
          <div className={section}>
            <p className={p}>
              AmplifiedAccess takes the security of WatchTower seriously. We
              appreciate the efforts of security researchers and community
              members who help us keep the platform safe for everyone.
            </p>
          </div>

          {/* Reporting */}
          <div className={section}>
            <h2 className={h2}>Reporting a Vulnerability</h2>
            <p className={p}>
              <strong>
                Please do not report security vulnerabilities through public
                GitHub issues.
              </strong>
            </p>
            <p className={p}>
              Instead, report them directly to our team by emailing:
            </p>
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
              You should receive a response within{" "}
              <strong>48 hours</strong>. If you do not, please follow up via
              email to confirm we received your original message.
            </p>
          </div>

          {/* What to include */}
          <div className={section}>
            <h2 className={h2}>What to Include</h2>
            <p className={p}>
              To help us triage your report as quickly as possible, please
              include as much of the following as you can provide:
            </p>
            <ul className={ul}>
              <li>
                Type of issue (e.g. SQL injection, cross-site scripting,
                authentication bypass, privilege escalation, etc.)
              </li>
              <li>
                Full paths of the source file(s) related to the manifestation of
                the issue
              </li>
              <li>
                The location of the affected code — branch, commit hash, or
                direct URL
              </li>
              <li>Any special configuration required to reproduce the issue</li>
              <li>Step-by-step instructions to reproduce the issue</li>
              <li>Proof-of-concept or exploit code, if possible</li>
              <li>
                Impact of the issue, including how an attacker might exploit it
              </li>
            </ul>
          </div>

          {/* Disclosure policy */}
          <div className={section}>
            <h2 className={h2}>Disclosure Policy</h2>
            <p className={p}>
              AmplifiedAccess follows the principle of{" "}
              <a
                href="https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                Coordinated Vulnerability Disclosure
              </a>
              . We ask that you give us a reasonable amount of time to
              investigate and address a reported issue before any public
              disclosure.
            </p>
            <p className={p}>
              We will keep you informed of our progress throughout the
              investigation and credit you for your discovery if you wish.
            </p>
          </div>

          {/* Preferred language */}
          <div className={section}>
            <h2 className={h2}>Preferred Language</h2>
            <p className={p}>
              We prefer all security communications to be in{" "}
              <strong>English</strong>.
            </p>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
