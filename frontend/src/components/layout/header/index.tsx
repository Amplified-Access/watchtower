"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Image from "next/image";
import MobileNavigation from "./components/mobile-navigation";
import Logo from "@/components/logo";
import LanguageSelector from "@/components/common/language-selector";
import { useTranslations } from "next-intl";

const Header = () => {
  const t = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useExtendedSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed flex items-center w-full top-0 z-10 transition-all ease-in-out duration-300 ${
        isScrolled || pathname != "/" ? "bg-primary py-4 text-white" : "py-6"
      } ${pathname == "/maps/live-incident-map" && "hidden"}`}
    >
      <div
        className={cn(
          "flex w-full mx-auto px-4 md:px-8 items-center  justify-between",
          "max-w-6xl",
        )}
      >
        <Logo
          color={isScrolled || pathname != "/" ? "primary" : "white"}
          className="object-contain object-left"
        />
        <div
          className={`hidden md:flex gap-6 font-title text-sm font-medium ${
            isScrolled
              ? " text-background"
              : pathname != "/"
                ? " text-background"
                : ""
          }`}
        >
          <Link href={"/datasets-page"}>{t("datasets")}</Link>
          <Link href={"/maps"}>{t("maps")}</Link>
          {/* <Link href={"/reports"}>{t("reports")}</Link> */}
          <Link href={"/chat"}>{t("chat")}</Link>
          <Link href={"/alerts"}>{t("alerts")}</Link>
          {/* <Link href={"/organizations"}>{t("organizations")}</Link> */}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <LanguageSelector
            variant="compact"
            className={cn(
              "border-none shadow-none",
              isScrolled
                ? "bg-background text-primary"
                : pathname != "/"
                  ? "bg-background text-primary"
                  : "bg-primary text-white",
            )}
          />
          <Link
            href={getDashboardUrl()}
            className={cn(
              "rounded-full px-6 py-2 text-white bg-primary font-title text-sm font-medium",
              isScrolled
                ? "bg-background text-primary"
                : pathname != "/"
                  ? "bg-background text-primary"
                  : "",
            )}
          >
            {isLoading
              ? tCommon("loading")
              : user && user.name
                ? tCommon("dashboard")
                : tCommon("signIn")}
          </Link>
          {/* <Link
            href={"/register-organization"}
            className={cn(
              " rounded-full px-6 py-2 text-white bg-primary",
              isScrolled || (pathname != "/" && "bg-white text-primary")
              // buttonVariants({
              //   variant: "outline",
              // })
            )}
          >
            Register organization
          </Link> */}
        </div>
      </div>
      <div className="md:hidden flex justify-end pr-4">
        <MobileNavigation scrolled={isScrolled} />
      </div>
    </header>
  );
};

export default Header;
