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
}

const ExploreSidebar = ({ stats }: ExploreSidebarProps) => {
  const t = useTranslations("HomeLivePreview");

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
    <div className="flex h-full w-full shrink-0 flex-col gap-6 border-white/10 p-5 lg:w-72 lg:border-r">
      <Logo color="primary" className="h-6 w-auto" />

      <div className="flex flex-col gap-1">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {t("exploreLabel")}
        </span>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                item.active ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {item.title}
                </span>
                <span className="block truncate text-xs text-white/40">
                  {item.subtitle}
                </span>
              </span>
              {item.badge && (
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
              {item.chevron && (
                <ChevronRight className="size-3.5 shrink-0 text-white/30" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          <span>{t("liveLabel")}</span>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="normal-case tracking-normal text-white/30">
            {t("updatedJustNow")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: t("statReports"), value: stats.totalReports },
            { label: t("statCountries"), value: stats.totalCountries },
            { label: t("statLanguages"), value: stats.totalLanguages },
            { label: t("statDeployments"), value: stats.totalDeployments },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-sm font-semibold text-white">{stat.value}</span>
              <span className="text-[10px] leading-tight text-white/40">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-white/40">
          {t("privacyNote")}{" "}
          <Link href="/about" className="text-white/70 underline hover:text-white">
            {t("learnMore")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ExploreSidebar;
