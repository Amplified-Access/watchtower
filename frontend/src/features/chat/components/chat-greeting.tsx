"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

// Greetings stay in their own languages whatever the UI locale — rotating
// through them signals that Esi can talk in any of them.
const GREETINGS = [
  { text: "Habari!", lang: "sw" },
  { text: "Hello!", lang: "en" },
  { text: "Oli otya?", lang: "lg" },
  { text: "Selam!", lang: "am" },
  { text: "Muraho!", lang: "rw" },
  { text: "Bonjour!", lang: "fr" },
  { text: "Salaam!", lang: "ur" },
];

const ChatBubbleIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 48 48"
    fill="none"
    className="size-12 text-primary md:size-14"
  >
    <path
      d="M24 5C13.5 5 5 13.1 5 23.1c0 4.1 1.4 7.9 3.9 10.9L7 43l9.3-3.4c2.4 1 5 1.5 7.7 1.5 10.5 0 19-8.1 19-18S34.5 5 24 5Z"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 22.5c1.8 3.6 5 5.5 8.5 5.5s6.7-1.9 8.5-5.5"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const ChatGreeting = () => {
  const t = useTranslations("ChatPage");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % GREETINGS.length), 3000);
    return () => clearInterval(id);
  }, []);

  const greeting = GREETINGS[index];

  return (
    <div className="flex flex-col items-center text-center">
      <ChatBubbleIcon />
      <h1 className="relative mt-3 h-16 w-full overflow-hidden font-title text-5xl font-medium text-dark md:h-24 md:text-7xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={greeting.text}
            lang={greeting.lang}
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-60%", opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="block"
          >
            {greeting.text}
          </motion.span>
        </AnimatePresence>
      </h1>
      <p className="mt-1 text-dark/60 md:text-lg">{t("subtitle")}</p>
    </div>
  );
};

export default ChatGreeting;
