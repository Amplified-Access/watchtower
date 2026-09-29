import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Container from "@/components/common/container";
import type { LegalPage } from "@/lib/sanity/types";

// A policy page from Sanity in the dark-header, single-column layout of the
// security policy and the code of conduct (the privacy policy has its own,
// with a table of contents). Block types match
// src/sanity/schemaTypes/policyBody.ts.

const p = "text-dark/70 text-base md:text-lg leading-relaxed mb-4";
const link = "text-primary underline hover:opacity-80 transition-opacity";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={p}>{children}</p>,
    h3: ({ children }) => <h3 className="font-title font-semibold text-lg text-dark mb-2 mt-6">{children}</h3>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 text-dark/70 text-base md:text-lg mb-4">{children}</ul>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? "";
      const external = /^https?:\/\//.test(href);
      return (
        <a href={href} className={link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
  },
};

type LegalDocumentProps = {
  page: LegalPage | null;
  /** The reader's language: sections served in another (English fallback) are marked with theirs. */
  locale: string;
};

const LegalDocument = ({ page, locale }: LegalDocumentProps) => (
  <>
    <section className="relative bg-dark text-background py-24">
      <div className="h-32 bg-linear-to-b from-transparent to-dark/10 w-full absolute bottom-0" />
      <Container size="text" className="text-center flex flex-col gap-4">
        <p className="text-primary font-title font-semibold uppercase tracking-widest text-sm">{page?.hero.eyebrow}</p>
        <h1 className="font-title font-semibold text-4xl lg:text-5xl leading-tight">{page?.hero.title}</h1>
        <p className="text-background/70 text-lg max-w-2xl mx-auto">{page?.hero.description}</p>
      </Container>
    </section>

    <section className="py-16 md:py-24">
      <Container size="text">
        {page?.sections.map((section) => (
          <div key={section.id} id={section.id} className="mb-10 scroll-mt-32">
            {section.title && (
              <h2
                lang={section.titleLanguage !== locale ? section.titleLanguage : undefined}
                className="font-title font-semibold text-2xl text-dark mb-3"
              >
                {section.title}
              </h2>
            )}
            <div lang={section.language !== locale ? section.language : undefined}>
              <PortableText value={section.body} components={components} />
            </div>
          </div>
        ))}
      </Container>
    </section>
  </>
);

export default LegalDocument;
