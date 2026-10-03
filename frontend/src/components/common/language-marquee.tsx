import { cn } from "@/lib/utils";

const SUPPORTED_LANGUAGES = [
  "English",
  "French",
  "Swahili",
  "Luganda",
  "Kinyarwanda",
  "Amharic",
  "Punjabi",
  "Urdu",
  "Kikuyu",
  "Sukuma",
  "Luo",
  "Oromo",
  "Dinka",
];

// Every language WatchTower is offered in, scrolling, at the size of the
// header's links. `names` and `label` give them in the reader's language (the
// About page passes its translated names and heading); `className` adds to or
// overrides the band, e.g. "[zoom:1]" inside a section that is already scaled.
const LanguageMarquee = ({
  names = SUPPORTED_LANGUAGES,
  label = "Supported languages",
  className,
}: {
  names?: string[];
  label?: string;
  className?: string;
}) => {
  return (
    <div
      role="marquee"
      aria-label={`${label}: ${names.join(", ")}`}
      className={cn(
        "overflow-hidden border-y border-border bg-background/50 py-2.5 [zoom:var(--viewport-scale)]",
        className,
      )}
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center font-title text-sm font-medium text-dark"
          >
            {names.map((language, index) => (
              <span key={index} className="flex items-center">
                <span className="px-3">{language}</span>
                <span className="text-dark/40">&bull;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageMarquee;
