"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUp, AudioLines, Check, Globe, Paperclip, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpeechDictation } from "../hooks/use-speech-dictation";

// Languages browsers' speech recognition actually handles; the rest of the
// app's locales (Luganda, Kinyarwanda, Kikuyu...) have no recogniser yet.
const DICTATION_LANGUAGES = [
  { locale: "en", tag: "en-US", name: "English" },
  { locale: "fr", tag: "fr-FR", name: "Français" },
  { locale: "sw", tag: "sw-KE", name: "Kiswahili" },
  { locale: "am", tag: "am-ET", name: "አማርኛ" },
  { locale: "pa", tag: "pa-Guru-IN", name: "ਪੰਜਾਬੀ" },
  { locale: "ur", tag: "ur-PK", name: "اردو" },
];

interface ChatComposerProps {
  onSubmit: (question: string) => void;
}

const ChatComposer = ({ onSubmit }: ChatComposerProps) => {
  const t = useTranslations("ChatPage");
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [dictationTag, setDictationTag] = useState(
    () => DICTATION_LANGUAGES.find((l) => l.locale === locale)?.tag ?? "en-US",
  );

  const dictation = useSpeechDictation({
    lang: dictationTag,
    onTranscript: (text) => setQuestion((prev) => `${prev}${text} `),
    onPermissionDenied: () => toast.error(t("micDenied")),
    onStartFailed: () => toast.error(t("dictationFailed")),
  });

  const send = (text: string) => {
    if (!text.trim()) return;
    dictation.stop();
    onSubmit(text.trim());
  };

  const toggleDictation = () => {
    if (dictation.isListening) {
      dictation.stop();
      return;
    }
    const result = dictation.start();
    if (result === "started") toast.success(t("listening"));
    if (result === "unsupported") toast.error(t("dictationNotSupported"));
  };

  const hasText = question.trim().length > 0;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {[t("starterWhatIs"), t("starterFindSomething")].map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => send(starter)}
            className="rounded-full border border-dark/10 bg-dark/2 px-3 py-1.5 font-title text-sm text-dark/80 transition-colors hover:border-dark/20 hover:text-dark"
          >
            {starter}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-dark/5 bg-[#fafafa] p-3 shadow-[0_6px_24px_-8px_rgba(0,153,153,0.25)] md:p-4">
        <Textarea
          value={question}
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setQuestion(e.target.value);
            // Typing takes over from dictation.
            if (dictation.isListening) dictation.stop();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(question);
            }
          }}
          className="min-h-12 resize-none border-none bg-transparent px-1 font-title text-base text-dark shadow-none placeholder:text-dark/70 focus-visible:ring-0 md:text-base"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title={t("attachComingSoon")}
              aria-label={t("attachComingSoon")}
              className="flex size-8 items-center justify-center rounded-md text-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Paperclip className="size-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("voiceLanguage")}
                title={t("voiceLanguage")}
                className="flex size-8 items-center justify-center rounded-md text-dark transition-colors hover:bg-dark/5"
              >
                <Globe className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44">
                <DropdownMenuLabel>{t("voiceLanguage")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DICTATION_LANGUAGES.map((language) => (
                  <DropdownMenuItem
                    key={language.tag}
                    onSelect={() => setDictationTag(language.tag)}
                  >
                    <Check
                      className={cn("size-4", dictationTag !== language.tag && "invisible")}
                    />
                    <span lang={language.locale}>{language.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stays a stop button while listening, even once text arrives. */}
          {hasText && !dictation.isListening ? (
            <button
              type="button"
              onClick={() => send(question)}
              aria-label={t("send")}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
            >
              <ArrowUp className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleDictation}
              aria-pressed={dictation.isListening}
              aria-label={dictation.isListening ? t("stopDictation") : t("startDictation")}
              title={dictation.isListening ? t("stopDictation") : t("startDictation")}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-white transition-colors",
                dictation.isListening
                  ? "animate-pulse bg-red-500 hover:bg-red-600"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              {dictation.isListening ? (
                <Square className="size-4 fill-current" />
              ) : (
                <AudioLines className="size-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComposer;
