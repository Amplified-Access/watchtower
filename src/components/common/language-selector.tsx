"use client";

import { useEffect, useState, useTransition } from "react";
import { setLocaleCookie } from "@/lib/actions/set-locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
  className?: string;
}

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "lg", name: "Luganda", flag: "🇺🇬" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "am", name: "አማርኛ", flag: "🇪🇹" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "ki", name: "Kikuyu", flag: "🇰🇪" },
  { code: "suk", name: "Sukuma", flag: "🇹🇿" },
];

function getCurrentLocale() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/locale=([^;]+)/);
  return match ? match[1] : "en";
}

export default function LanguageSelector({
  variant = "default",
  className = "",
}: LanguageSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrentLocale(getCurrentLocale());
  }, []);

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === currentLocale) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      await setLocaleCookie(newLocale);
      setCurrentLocale(newLocale);
      setOpen(false);
      window.location.reload();
    });
  };

  if (variant === "compact") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            role="combobox"
            aria-expanded={open}
            aria-label="Select language"
            disabled={isPending}
            className={cn("h-9 w-9", className)}
          >
            <Globe className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="space-y-1">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentLocale === lang.code && "bg-accent",
                )}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isPending}
              >
                <span className="mr-2">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {currentLocale === lang.code && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          role="combobox"
          aria-expanded={open}
          aria-label="Select language"
          disabled={isPending}
          className={cn("h-9 w-9", className)}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        <div className="space-y-1">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                currentLocale === lang.code && "bg-accent",
              )}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isPending}
            >
              <span className="mr-2">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {currentLocale === lang.code && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
