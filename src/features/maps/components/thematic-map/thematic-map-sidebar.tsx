import * as React from "react";
import { X } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  // Get theme color for UI elements
  const getThemeColor = (themeName: string) => {
    const colors = {
      Battles: "text-red-600 border-red-200 bg-red-50",
      "Explosions/Remote violence":
        "text-orange-600 border-orange-200 bg-orange-50",
      Protests: "text-blue-600 border-blue-200 bg-blue-50",
      Riots: "text-purple-600 border-purple-200 bg-purple-50",
      "Strategic developments": "text-green-600 border-green-200 bg-green-50",
      "Violence against civilians": "text-pink-600 border-pink-200 bg-pink-50",
    };
    return (
      colors[themeName as keyof typeof colors] ||
      "text-red-600 border-red-200 bg-red-50"
    );
  };

  const themeColorClass = getThemeColor(theme);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarGroup>
          <SidebarMenu className="md:pt-14">
            {/* Theme indicator */}
            {/* <div className={`p-3 rounded-lg border mb-6 ${themeColorClass}`}>
              <h3 className="font-semibold text-sm mb-1">Viewing: {theme}</h3>
              <p className="text-xs opacity-75">
                This map shows incidents specifically related to{" "}
                {theme.toLowerCase()}.
              </p>
            </div> */}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold">Filters</h4>
                {hasFilters && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Select value={name ?? undefined} onValueChange={setName}>
                <SelectTrigger className="w-full shadow-none outline-none ring-0 bg-white">
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
              <Select
                value={timeframe ?? undefined}
                onValueChange={setTimeframe}
              >
                <SelectTrigger className="w-full shadow-none outline-none ring-0 bg-white">
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

            {/* Theme-specific information */}
            <div className="mt-8 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">About {theme}</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {theme === "Battles" && (
                  <p>
                    Armed confrontations between organized groups including
                    state forces, rebel groups, and militias.
                  </p>
                )}
                {theme === "Explosions/Remote violence" && (
                  <p>
                    Incidents involving explosives, airstrikes, artillery, and
                    other remote forms of violence.
                  </p>
                )}
                {theme === "Protests" && (
                  <p>
                    Peaceful demonstrations and organized public displays of
                    opinion or dissent.
                  </p>
                )}
                {theme === "Riots" && (
                  <p>
                    Violent crowd actions and civil disorder involving public
                    violence and property damage.
                  </p>
                )}
                {theme === "Strategic developments" && (
                  <p>
                    Important political, military, or organizational changes
                    that affect conflict dynamics.
                  </p>
                )}
                {theme === "Violence against civilians" && (
                  <p>
                    Intentional attacks on non-combatants including killings,
                    kidnappings, and other targeted violence.
                  </p>
                )}
              </div>
            </div>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
