"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const AnnouncementBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const t = useTranslations("AnnouncementBanner");
  const tCommon = useTranslations("Common");

  return (
    // The button wraps under the message only when the row runs out of room,
    // so wider phones keep one line. Left-aligned on mobile (pr-10 keeps it
    // clear of the close button), centred from md. The height varies with the
    // wrap, so the header measures it rather than assuming h-11.
    <div className="relative flex min-h-11 items-center bg-primary py-2 pr-10 pl-4 text-white md:justify-center md:px-8 xl:px-16 [zoom:var(--viewport-scale)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium">
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
