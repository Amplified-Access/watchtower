import * as React from "react";
import { X } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";

const THEME_DESCRIPTIONS: Record<string, string> = {
  Battles:
    "Armed confrontations between organized groups including state forces, rebel groups, and militias.",
  "Explosions/Remote violence":
    "Incidents involving explosives, airstrikes, artillery, and other remote forms of violence.",
  Protests:
    "Peaceful demonstrations and organized public displays of opinion or dissent.",
  Riots:
    "Violent crowd actions and civil disorder involving public violence and property damage.",
  "Strategic developments":
    "Important political, military, or organizational changes that affect conflict dynamics.",
  "Violence against civilians":
    "Intentional attacks on non-combatants including killings, kidnappings, and other targeted violence.",
};

interface ThematicMapSidebarProps extends React.ComponentProps<typeof Sidebar> {
  theme: string;
}

export function ThematicMapSidebar({
  theme,
  ...props
}: ThematicMapSidebarProps) {
  const [name, setName] = useQueryState("country");
  const [timeframe, setTimeframe] = useQueryState("timeframe");

  const clearAllFilters = () => {
    setName(null);
    setTimeframe(null);
  };

  const activeFilterCount = [name, timeframe].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  return (
    <Sidebar
      {...props}
      className="border-l border-border [&_[data-sidebar=sidebar]]:bg-white"
    >
      <SidebarContent>
        <SidebarGroup className="gap-6 p-6 md:pt-24">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-title text-xs font-semibold uppercase tracking-wide text-dark/60">
                Filters
              </h4>
              {hasFilters && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-title text-xs font-medium text-primary">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 cursor-pointer px-2 font-title text-xs text-primary hover:bg-primary/10 hover:text-primary"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-title text-xs font-semibold uppercase tracking-wide text-dark/60">
              Country
            </span>
              <Select value={name ?? undefined} onValueChange={setName}>
                <SelectTrigger className="w-full cursor-pointer border-border bg-white font-title text-dark shadow-none outline-none ring-0">
                  <SelectValue placeholder="Select a Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Tanzania">Tanzania</SelectItem>
                    <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-title text-xs font-semibold uppercase tracking-wide text-dark/60">
              Time period
            </span>
            <Select value={timeframe ?? undefined} onValueChange={setTimeframe}>
              <SelectTrigger className="w-full cursor-pointer border-border bg-white font-title text-dark shadow-none outline-none ring-0">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectGroup>
                </SelectContent>
            </Select>
          </div>

          {/* These descriptions only cover the original ACLED-style themes; the
              incident types this app ships with have no copy yet, so the panel
              is skipped rather than rendered as an empty box. */}
          {THEME_DESCRIPTIONS[theme] && (
            <div className="rounded-lg bg-dark/5 p-3">
              <h4 className="mb-2 font-title text-sm font-medium text-dark">
                About {theme}
              </h4>
              <p className="text-xs text-dark/60">{THEME_DESCRIPTIONS[theme]}</p>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
