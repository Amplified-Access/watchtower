"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const AnnouncementBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const t = useTranslations("AnnouncementBanner");
  const tCommon = useTranslations("Common");

  return (
    <div className="relative flex h-11 items-center justify-center bg-primary px-4 text-white md:px-8 xl:px-16 [zoom:var(--viewport-scale)]">
      <div className="flex items-center gap-3 text-sm font-medium">
        <span>{t("message")}</span>
        <Link
          href="/anonymous-reports"
          className="rounded-full border border-white/70 px-3 py-1 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          {t("cta")}
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={tCommon("close")}
        className="absolute right-4 text-white/80 transition-colors hover:text-white md:right-8 xl:right-16"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
