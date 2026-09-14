"use client";

import { useEffect, useState, useTransition } from "react";
import { setLocaleCookie } from "@/lib/actions/set-locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
  className?: string;
}

const languages = [
  { code: "en", name: "English", short: "Eng", flag: "🇬🇧" },
  { code: "fr", name: "Français", short: "Fr", flag: "🇫🇷" },
  { code: "sw", name: "Kiswahili", short: "Swa", flag: "🇰🇪" },
  { code: "lg", name: "Luganda", short: "Lg", flag: "🇺🇬" },
  { code: "rw", name: "Kinyarwanda", short: "Rw", flag: "🇷🇼" },
  { code: "am", name: "አማርኛ", short: "Am", flag: "🇪🇹" },
  { code: "pa", name: "ਪੰਜਾਬੀ", short: "Pa", flag: "🇮🇳" },
  { code: "ur", name: "اردو", short: "Ur", flag: "🇵🇰" },
  { code: "ki", name: "Kikuyu", short: "Ki", flag: "🇰🇪" },
  { code: "suk", name: "Sukuma", short: "Suk", flag: "🇹🇿" },
  { code: "luo", name: "Dholuo", short: "Luo", flag: "🇰🇪" },
  { code: "om", name: "Afaan Oromoo", short: "Om", flag: "🇪🇹" },
  { code: "din", name: "Thuɔŋjäŋ", short: "Din", flag: "🇸🇸" },
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
    const currentLanguage = languages.find(
      (lang) => lang.code === currentLocale,
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-label="Select language"
            disabled={isPending}
            className={cn(className)}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {currentLanguage?.short}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-50 p-2">
          <div className="space-y-1">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentLocale === lang.code &&
                    "bg-accent text-primary hover:text-primary",
                )}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isPending}
              >
                <span className="w-8 shrink-0 text-left text-xs font-bold tracking-wide text-muted-foreground">
                  {lang.code.toUpperCase()}
                </span>
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
      <PopoverContent className="w-50 p-2">
        <div className="space-y-1">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                currentLocale === lang.code &&
                  "bg-accent text-primary hover:text-primary",
              )}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isPending}
            >
              <span className="w-8 shrink-0 text-left text-xs font-bold tracking-wide text-muted-foreground">
                {lang.code.toUpperCase()}
              </span>
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
