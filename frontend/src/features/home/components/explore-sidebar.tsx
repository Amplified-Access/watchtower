"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Globe2,
  Clock,
  ListFilter,
  MapPin,
  Languages as LanguagesIcon,
  Rocket,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";

interface ExploreSidebarProps {
  stats: {
    totalReports: number;
    recentReports: number;
    totalCountries: number;
    totalDeployments: number;
    totalLanguages: number;
  };
  /** "dark" floats over the homepage preview; "light" is the docked live map panel. */
  variant?: "dark" | "light";
  /** Rendered beside the Explore heading, e.g. a collapse button. */
  headerAction?: React.ReactNode;
}

const STYLES = {
  dark: {
    root: "gap-6 p-5 lg:w-72",
    heading: "px-2 text-[11px] font-semibold uppercase tracking-widest text-white/40",
    item: "gap-3 rounded-lg px-2 py-2 hover:bg-white/5",
    itemActive: "bg-white/10",
    icon: "size-8 rounded-full bg-white/10 text-white",
    iconSvg: "size-4",
    title: "text-sm font-medium text-white",
    subtitle: "text-xs text-white/40",
    badge: "rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white",
    chevron: "size-3.5 text-white/30",
    footer: "border-white/10 pt-4",
    liveLabel: "text-white/40",
    updated: "normal-case tracking-normal text-white/30",
    statGrid: "grid grid-cols-4 gap-2 text-center",
    stat: "",
    statValue: "text-sm font-semibold text-white",
    statLabel: "text-[10px] leading-tight text-white/40",
    note: "text-[11px] leading-relaxed text-white/40",
    learnMore: "text-white/70 underline hover:text-white",
  },
  light: {
    root: "gap-5 px-6 py-6",
    heading: "font-title text-xs font-medium uppercase tracking-wide text-dark",
    item: "gap-4 rounded-md px-1 py-3 hover:bg-dark/3",
    itemActive: "",
    icon: "size-8 text-dark",
    iconSvg: "size-6 stroke-[1.5]",
    title: "font-title text-sm font-medium text-dark",
    subtitle: "text-sm text-dark/50",
    badge: "font-title text-base text-dark",
    chevron: "size-4 text-dark",
    footer: "border-dark/60 pt-6",
    liveLabel: "text-dark",
    updated: "ms-auto normal-case tracking-normal text-dark",
    statGrid: "flex justify-between divide-x divide-dark/30",
    stat: "px-2 first:ps-0 last:pe-0",
    statValue: "font-title text-base text-dark",
    statLabel: "text-xs whitespace-nowrap text-dark/50",
    note: "text-xs leading-snug text-dark/50",
    learnMore: "mt-4 block text-sm text-primary hover:underline",
  },
} as const;

const ExploreSidebar = ({ stats, variant = "dark", headerAction }: ExploreSidebarProps) => {
  const t = useTranslations("HomeLivePreview");
  const s = STYLES[variant];
  const isLight = variant === "light";

  const navItems = [
    {
      icon: Globe2,
      title: t("navAllReports"),
      subtitle: t("navAllReportsSub"),
      badge: `${stats.totalReports}+`,
      active: true,
      href: "/maps",
    },
    {
      icon: Clock,
      title: t("navRecentReports"),
      subtitle: t("navRecentReportsSub"),
      badge: String(stats.recentReports),
      href: "/maps",
    },
    {
      icon: ListFilter,
      title: t("navIssues"),
      subtitle: t("navIssuesSub"),
      chevron: true,
      href: "/maps",
    },
    {
      icon: MapPin,
      title: t("navLocations"),
      subtitle: t("navLocationsSub"),
      chevron: true,
      href: "/maps",
    },
    {
      icon: LanguagesIcon,
      title: t("navLanguages"),
      subtitle: t("navLanguagesSub"),
      badge: String(stats.totalLanguages),
      chevron: true,
      href: "/about",
    },
    {
      icon: Rocket,
      title: t("navDeployments"),
      subtitle: t("navDeploymentsSub"),
      badge: String(stats.totalDeployments),
      chevron: true,
      href: "/organizations",
    },
    {
      icon: TrendingUp,
      title: t("navEmergingPatterns"),
      subtitle: t("navEmergingPatternsSub"),
      chevron: true,
      href: "/insights",
    },
  ];

  return (
    <div className={cn("flex h-full w-full shrink-0 flex-col", s.root)}>
      {!isLight && <Logo color="primary" className="h-6 w-auto" />}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={s.heading}>{t("exploreLabel")}</span>
          {headerAction}
        </div>
        <nav className={cn("flex flex-col", isLight ? "mt-4 gap-1" : "gap-0.5")}>
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center text-left transition-colors",
                s.item,
                item.active && s.itemActive,
              )}
            >
              <span className={cn("flex shrink-0 items-center justify-center", s.icon)}>
                <item.icon className={s.iconSvg} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate", s.title)}>{item.title}</span>
                <span className={cn("block truncate", s.subtitle)}>{item.subtitle}</span>
              </span>
              {item.badge && !(isLight && item.chevron) && (
                <span className={cn("shrink-0", s.badge)}>{item.badge}</span>
              )}
              {item.chevron && <ChevronRight className={cn("shrink-0", s.chevron)} />}
            </Link>
          ))}
        </nav>
      </div>

      <div className={cn("mt-auto flex flex-col gap-3 border-t", s.footer)}>
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest",
            s.liveLabel,
          )}
        >
          <span className={cn(isLight && "font-title text-xs font-medium tracking-wide")}>
            {t("liveLabel")}
          </span>
          {isLight ? (
            <span className={cn("flex items-center gap-1.5 font-title text-sm font-normal", s.updated)}>
              <span className="size-2 rounded-full bg-emerald-500" />
              {t("updatedJustNow")}
            </span>
          ) : (
            <>
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className={s.updated}>{t("updatedJustNow")}</span>
            </>
          )}
        </div>
        <div className={s.statGrid}>
          {[
            { label: t("statReports"), value: isLight ? `${stats.totalReports}+` : stats.totalReports },
            { label: t("statCountries"), value: stats.totalCountries },
            { label: t("statLanguages"), value: stats.totalLanguages },
            { label: t("statDeployments"), value: stats.totalDeployments },
          ].map((stat) => (
            <div key={stat.label} className={cn("flex min-w-0 flex-col", s.stat)}>
              <span className={s.statValue}>{stat.value}</span>
              <span className={cn(!isLight && "truncate", s.statLabel)}>{stat.label}</span>
            </div>
          ))}
        </div>
        {isLight ? (
          <div className="mt-2">
            <p className={cn("flex gap-3", s.note)}>
              <Info className="mt-0.5 size-4 shrink-0 text-dark" />
              {t("privacyNote")}
            </p>
            <Link href="/privacy-policy" className={cn("ps-7", s.learnMore)}>
              {t("learnMore")}
            </Link>
          </div>
        ) : (
          <p className={s.note}>
            {t("privacyNote")}{" "}
            <Link href="/about" className={s.learnMore}>
              {t("learnMore")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ExploreSidebar;
