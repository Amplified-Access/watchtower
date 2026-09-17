"use client";

import { useTranslations } from "next-intl";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

// Greetings stay in their own languages whatever the UI locale — rotating
// through them signals that Esi can talk in any of them.
const GREETINGS = [
  "Habari!",
  "Hello!",
  "Oli otya?",
  "Selam!",
  "Muraho!",
  "Bonjour!",
  "Salaam!",
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
      <div aria-hidden className="flex h-16 items-center justify-center md:h-24">
        <ContainerTextFlip
          words={GREETINGS}
          interval={3000}
          animationDuration={700}
          morphWidth={false}
          className="rounded-none p-0 font-title text-5xl font-medium text-dark md:text-7xl"
          textClassName="font-title"
        />
      </div>
      <h1 className="mt-1 text-dark/60 md:text-lg">{t("subtitle")}</h1>
    </div>
  );
};

export default ChatGreeting;
