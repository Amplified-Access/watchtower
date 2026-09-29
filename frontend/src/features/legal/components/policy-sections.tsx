import { ArrowRight } from "lucide-react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PolicyBodyBlock, PolicySection } from "@/lib/sanity/types";

type Definitions = Extract<PolicyBodyBlock, { _type: "definitions" }>;
type CallToAction = Extract<PolicyBodyBlock, { _type: "callToAction" }>;
type Contacts = Extract<PolicyBodyBlock, { _type: "contacts" }>;

// Block types match src/sanity/schemaTypes/policyBody.ts. A paragraph in bold is
// the policy's emphasised statement or a list's title.
const components: PortableTextComponents = {
  block: { normal: ({ children }) => <p>{children}</p> },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-0.5 ps-9 marker:text-dark/50">{children}</ul>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-dark/70">{children}</strong>,
    link: ({ value, children }) => (
      <a href={value?.href} className="text-primary underline underline-offset-2">
        {children}
      </a>
    ),
  },
  types: {
    definitions: ({ value }: { value: Definitions }) => (
      <dl className="space-y-4">
        {value.items.map((item) => (
          <div key={item._key}>
            <dt className="font-semibold text-dark/70">{item.term}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    ),
    callToAction: ({ value }: { value: CallToAction }) => (
      <a
        href={value.href}
        className="inline-flex w-fit items-center gap-1 text-primary underline-offset-4 hover:underline"
      >
        {value.text}
        <ArrowRight className="size-4" />
      </a>
    ),
    contacts: ({ value }: { value: Contacts }) => (
      <p>
        {value.items.map((item) => (
          <span key={item._key} className="block">
            {item.label}:{" "}
            <a href={`mailto:${item.email}`} className="text-primary underline underline-offset-2">
              {item.email}
            </a>
          </span>
        ))}
      </p>
    ),
  },
};

type PolicySectionsProps = {
  sections: PolicySection[];
  /** The page's language; sections served in another (English fallback) are marked with theirs. */
  locale: string;
};

const PolicySections = ({ sections, locale }: PolicySectionsProps) => {
  return (
    <div className="flex flex-col gap-12 md:gap-14">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-40">
          {/* Title and body are translated separately, so each says its own language. */}
          {section.title && (
            <h2
              lang={section.titleLanguage !== locale ? section.titleLanguage : undefined}
              className="font-title text-3xl font-medium text-dark md:text-4xl"
            >
              {section.title}
            </h2>
          )}
          {/* A list sits right under the bold line that introduces it. */}
          <div
            lang={section.language !== locale ? section.language : undefined}
            className="mt-4 flex flex-col gap-4 leading-snug text-dark/60 md:text-lg [&_p:has(>strong:only-child)+ul]:-mt-3"
          >
            <PortableText value={section.body} components={components} />
          </div>
        </section>
      ))}
    </div>
  );
};

export default PolicySections;
