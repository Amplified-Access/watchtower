import { ArrowRight } from "lucide-react";
import type { PolicyBlock, PolicySection } from "../content/privacy-policy";

const PolicyBlockView = ({ block }: { block: PolicyBlock }) => {
  switch (block.type) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "emphasis":
      return <p className="font-semibold text-dark/70">{block.text}</p>;
    case "list":
      return (
        <div>
          {block.title && <p className="font-semibold text-dark/70">{block.title}</p>}
          <ul className="mt-1 list-disc space-y-0.5 ps-9 marker:text-dark/50">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case "definitions":
      return (
        <dl className="space-y-4">
          {block.items.map((item) => (
            <div key={item.term}>
              <dt className="font-semibold text-dark/70">{item.term}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      );
    case "link":
      return (
        <a
          href={block.href}
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          {block.text}
          <ArrowRight className="size-4" />
        </a>
      );
    case "contact":
      return (
        <p>
          {block.items.map((item) => (
            <span key={item.email} className="block">
              {item.label}:{" "}
              <a href={`mailto:${item.email}`} className="text-primary underline underline-offset-2">
                {item.email}
              </a>
            </span>
          ))}
        </p>
      );
  }
};

const PolicySections = ({ sections }: { sections: PolicySection[] }) => {
  return (
    <div className="flex flex-col gap-12 md:gap-14">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-40">
          <h2 className="font-title text-3xl font-medium text-dark md:text-4xl">{section.title}</h2>
          <div className="mt-4 flex flex-col gap-4 leading-snug text-dark/60 md:text-lg">
            {section.blocks.map((block, index) => (
              <PolicyBlockView key={index} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default PolicySections;
