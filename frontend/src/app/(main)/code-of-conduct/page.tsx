import Container from "@/components/common/container";
import Footer from "@/components/layout/footer/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code of Conduct — WatchTower",
  description:
    "AmplifiedAccess community standards and code of conduct for contributors and participants.",
};

const section = "mb-10";
const h2 = "font-title font-semibold text-2xl text-dark mb-3";
const h3 = "font-title font-semibold text-lg text-dark mb-2 mt-6";
const p = "text-dark/70 text-base md:text-lg leading-relaxed mb-4";
const ul = "list-disc pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4";
const ol = "list-decimal pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4";

export default function CodeOfConductPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-dark text-background py-24">
        <div className="h-32 bg-linear-to-b from-transparent to-dark/10 w-full absolute bottom-0" />
        <Container size="text" className="text-center flex flex-col gap-4">
          <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">
            Community
          </p>
          <h1 className="font-title font-semibold text-4xl lg:text-5xl leading-tight">
            Code of Conduct
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            Our commitment to an open, welcoming, and harassment-free community
            for everyone.
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <Container size="text">
          {/* Our Pledge */}
          <div className={section}>
            <h2 className={h2}>Our Pledge</h2>
            <p className={p}>
              We as members, contributors, and leaders of the AmplifiedAccess
              community pledge to make participation in our community a
              harassment-free experience for everyone, regardless of age, body
              size, visible or invisible disability, ethnicity, sex
              characteristics, gender identity and expression, level of
              experience, education, socio-economic status, nationality,
              personal appearance, race, caste, color, religion, or sexual
              identity and orientation.
            </p>
            <p className={p}>
              We pledge to act and interact in ways that contribute to an open,
              welcoming, diverse, inclusive, and healthy community.
            </p>
          </div>

          {/* Our Standards */}
          <div className={section}>
            <h2 className={h2}>Our Standards</h2>
            <p className={p}>
              Examples of behavior that contribute to a positive environment
              include:
            </p>
            <ul className={ul}>
              <li>
                Demonstrating empathy and kindness toward other people
              </li>
              <li>
                Being respectful of differing opinions, viewpoints, and
                experiences
              </li>
              <li>
                Giving and gracefully accepting constructive feedback
              </li>
              <li>
                Accepting responsibility and apologizing to those affected by
                our mistakes, and learning from the experience
              </li>
              <li>
                Focusing on what is best not just for us as individuals, but for
                the overall community
              </li>
            </ul>
            <p className={p}>
              Examples of unacceptable behavior include:
            </p>
            <ul className={ul}>
              <li>
                The use of sexualized language or imagery, and sexual attention
                or advances of any kind
              </li>
              <li>
                Trolling, insulting or derogatory comments, and personal or
                political attacks
              </li>
              <li>Public or private harassment</li>
              <li>
                Publishing others&apos; private information, such as a physical
                or email address, without their explicit permission
              </li>
              <li>
                Other conduct which could reasonably be considered inappropriate
                in a professional setting
              </li>
            </ul>
          </div>

          {/* Enforcement Responsibilities */}
          <div className={section}>
            <h2 className={h2}>Enforcement Responsibilities</h2>
            <p className={p}>
              Community leaders at AmplifiedAccess are responsible for
              clarifying and enforcing our standards of acceptable behavior and
              will take appropriate and fair corrective action in response to any
              behavior that they deem inappropriate, threatening, offensive, or
              harmful.
            </p>
            <p className={p}>
              Community leaders have the right and responsibility to remove,
              edit, or reject comments, commits, code, wiki edits, issues, and
              other contributions that are not aligned with this Code of
              Conduct, and will communicate reasons for moderation decisions when
              appropriate.
            </p>
          </div>

          {/* Scope */}
          <div className={section}>
            <h2 className={h2}>Scope</h2>
            <p className={p}>
              This Code of Conduct applies within all community spaces, and also
              applies when an individual is officially representing the
              AmplifiedAccess community in public spaces. Examples of
              representing our community include using an official email address,
              posting via an official social media account, or acting as an
              appointed representative at an online or offline event.
            </p>
          </div>

          {/* Enforcement */}
          <div className={section}>
            <h2 className={h2}>Reporting</h2>
            <p className={p}>
              Instances of abusive, harassing, or otherwise unacceptable
              behavior may be reported to the AmplifiedAccess team at:
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
              All complaints will be reviewed and investigated promptly and
              fairly. All community leaders are obligated to respect the privacy
              and security of the reporter of any incident.
            </p>
          </div>

          {/* Enforcement Guidelines */}
          <div className={section}>
            <h2 className={h2}>Enforcement Guidelines</h2>
            <p className={p}>
              Community leaders will follow these guidelines in determining the
              consequences for any action they deem in violation of this Code of
              Conduct:
            </p>

            <h3 className={h3}>1. Correction</h3>
            <p className={p}>
              <strong>Community Impact:</strong> Use of inappropriate language or
              other behavior deemed unprofessional or unwelcome in the community.
            </p>
            <p className={p}>
              <strong>Consequence:</strong> A private, written warning from
              community leaders, providing clarity around the nature of the
              violation and an explanation of why the behavior was inappropriate.
              A public apology may be requested.
            </p>

            <h3 className={h3}>2. Warning</h3>
            <p className={p}>
              <strong>Community Impact:</strong> A violation through a single
              incident or series of actions.
            </p>
            <p className={p}>
              <strong>Consequence:</strong> A warning with consequences for
              continued behavior. No interaction with the people involved,
              including unsolicited interaction with those enforcing the Code of
              Conduct, for a specified period of time. Violating these terms may
              lead to a temporary or permanent ban.
            </p>

            <h3 className={h3}>3. Temporary Ban</h3>
            <p className={p}>
              <strong>Community Impact:</strong> A serious violation of community
              standards, including sustained inappropriate behavior.
            </p>
            <p className={p}>
              <strong>Consequence:</strong> A temporary ban from any sort of
              interaction or public communication with the community for a
              specified period of time. No public or private interaction with the
              people involved is allowed during this period. Violating these
              terms may lead to a permanent ban.
            </p>

            <h3 className={h3}>4. Permanent Ban</h3>
            <p className={p}>
              <strong>Community Impact:</strong> Demonstrating a pattern of
              violation of community standards, including sustained inappropriate
              behavior, harassment of an individual, or aggression toward or
              disparagement of classes of individuals.
            </p>
            <p className={p}>
              <strong>Consequence:</strong> A permanent ban from any sort of
              public interaction within the community.
            </p>
          </div>

          {/* Attribution */}
          <div className={section}>
            <h2 className={h2}>Attribution</h2>
            <p className={p}>
              This Code of Conduct is adapted from the{" "}
              <a
                href="https://www.contributor-covenant.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                Contributor Covenant
              </a>
              , version 2.1, available at{" "}
              <a
                href="https://www.contributor-covenant.org/version/2/1/code_of_conduct/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                contributor-covenant.org/version/2/1/code_of_conduct
              </a>
              .
            </p>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
