"use client";

import { useTranslations } from "next-intl";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

// Greetings stay in their own languages whatever the UI locale — rotating
// through them signals that Esi can talk in any of them.
// Each in its own script: Amharic in Ge'ez, Punjabi in Gurmukhi and Urdu in
// Arabic script, which ContainerTextFlip writes on right to left.
const GREETINGS = [
  "Habari!", // Swahili
  "Hello!", // English
  "Oli otya?", // Luganda
  "ሰላም!", // Amharic
  "Muraho!", // Kinyarwanda
  "Bonjour!", // French
  "سلام!", // Urdu
  "ਸਤ ਸ੍ਰੀ ਅਕਾਲ!", // Punjabi
  "Akkam!", // Oromo
  "Wĩmwega!", // Kikuyu
  "Misawa!", // Luo
  "Mwangaluka!", // Sukuma
];

const ChatGreeting = () => {
  const t = useTranslations("ChatPage");

  return (
    <div className="flex flex-col items-center text-center">
      {/* ContainerTextFlip reveals the word letter by letter — the write-on
          effect this page used before the rebrand. morphWidth is off so each
          greeting animates in place rather than sliding as the box resizes.
          Decorative motion, so it is hidden from assistive tech and the
          subtitle below carries the heading. */}
      <div aria-hidden className="flex h-14 items-center justify-center">
        <ContainerTextFlip
          words={GREETINGS}
          interval={3000}
          animationDuration={700}
          morphWidth={false}
          // Same size as the other page titles (case studies, alerts…);
          // md:text-4xl overrides the component's own md:text-5xl default.
          className="rounded-none p-0 font-title text-4xl leading-tight font-semibold text-dark md:text-4xl"
          textClassName="font-title"
        />
      </div>
      <h1 className="mt-1 text-base text-dark/60">{t("subtitle")}</h1>
    </div>
  );
};

export default ChatGreeting;
