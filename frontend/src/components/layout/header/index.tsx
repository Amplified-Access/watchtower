"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useExtendedSession } from "@/hooks/use-extended-session";
import MobileNavigation from "./components/mobile-navigation";
import AnnouncementBanner from "./components/announcement-banner";
import Logo from "@/components/logo";
import LanguageSelector from "@/components/common/language-selector";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const BANNER_DISMISSED_KEY = "wt-announcement-dismissed";

const Header = () => {
  const t = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();
  const { user, isLoading } = useExtendedSession();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(BANNER_DISMISSED_KEY) === "1") {
      setShowBanner(false);
    }
  }, []);

  // Publishes the banner's rendered height as --banner-height for the spacer
  // below and for full-height pages. It wraps to two lines on narrow screens,
  // so a fixed value would leave the header overlapping content.
  const [bannerEl, setBannerEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = document.documentElement.style;
    if (!bannerEl) {
      root.setProperty("--banner-height", "0px");
      return;
    }
    const update = () =>
      root.setProperty("--banner-height", `${bannerEl.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bannerEl);
    return () => {
      observer.disconnect();
      root.setProperty("--banner-height", "0px");
    };
  }, [bannerEl]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, "1");
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return "/sign-in";

    switch (user.role) {
      case "super-admin":
        return "/superadmin";
      case "admin":
        return "/admin";
      case "watcher":
        return "/watcher";
      default:
        return "/sign-in";
    }
  };

  // Full-screen map routes (the live map and every thematic /maps/<slug> map)
  // render their own header with the map's search and filter controls. The
  // marketing header would sit on top of it at a higher z-index and swallow
  // that search. /maps itself is the landing page and keeps this header.
  const isFullScreenMap = pathname !== "/maps" && pathname.startsWith("/maps/");
  // The conversation view is a full-height thread with its own back button, so
  // it reclaims the header's vertical space too.
  const isConversation = pathname.startsWith("/chat/conversation");
  const isHome = pathname === "/";
  if (isFullScreenMap || isConversation) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-30">
        {showBanner && !isHome && (
          <div ref={setBannerEl}>
            <AnnouncementBanner onDismiss={dismissBanner} />
          </div>
        )}
        <header className="flex items-center w-full bg-white border-b border-border py-4">
          <div
            className={cn(
              "mx-auto flex w-full max-w-360 items-center justify-between",
              "px-4 md:px-8 xl:px-16 [zoom:var(--viewport-scale)]",
            )}
          >
            <Logo color="white" className="object-contain object-left" />
            <div className="hidden lg:flex gap-6 font-title text-sm font-medium">
              <Link href={"/about"}>{t("about")}</Link>
              <Link href={"/maps"}>{t("maps")}</Link>
              <Link href={"/case-studies"}>{t("caseStudies")}</Link>
              {/* <Link href={"/reports"}>{t("reports")}</Link> */}
              <Link href={"/chat"}>{t("chat")}</Link>
              <Link href={"/alerts"}>{t("alerts")}</Link>
              {/* <Link href={"/organizations"}>{t("organizations")}</Link> */}
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSelector
                variant="compact"
                className="border-border bg-white text-dark shadow-none hover:bg-background"
              />
              <Link
                href={getDashboardUrl()}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "font-title text-sm font-medium",
                )}
              >
                {isLoading
                  ? tCommon("loading")
                  : user && user.name
                    ? tCommon("dashboard")
                    : tCommon("signIn")}
              </Link>
            </div>
          </div>
          <div className="lg:hidden flex justify-end pr-4 md:pr-8">
            <MobileNavigation />
          </div>
        </header>
      </div>
      {showBanner && !isHome && <div className="h-(--banner-height)" />}
    </>
  );
};

export default Header;
