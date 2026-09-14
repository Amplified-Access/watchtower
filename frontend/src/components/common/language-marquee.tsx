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

const LanguageMarquee = () => {
  return (
    <div
      role="marquee"
      aria-label={`Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`}
      className="overflow-hidden border-y border-border bg-background/50 py-2.5 [zoom:var(--viewport-scale)]"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center font-title text-sm font-medium text-dark"
          >
            {SUPPORTED_LANGUAGES.map((language, index) => (
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
