import * as React from "react";
import { GalleryVerticalEnd, X } from "lucide-react";

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
import IncidentTypeCombobox from "./incident-type-combobox";
import { Button } from "@/components/ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [name, setName] = useQueryState("country");
  const [selectedCategory, setSelectedCategory] = useQueryState("category");
  const [timeframe, setTimeframe] = useQueryState("timeframe");

  const clearAllFilters = () => {
    setName(null);
    setSelectedCategory(null);
    setTimeframe(null);
  };

  const activeFilterCount = [name, selectedCategory, timeframe].filter(
    Boolean,
  ).length;
  const hasFilters = activeFilterCount > 0;
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
                <SelectTrigger className="w-full shadow-none outline-none ring-0 bg-white ">
                  <SelectValue placeholder="Select a Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {/* <SelectLabel>Kenya</SelectLabel> */}
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Tanzania">Tanzania</SelectItem>
                    <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <IncidentTypeCombobox />
              <Select
                value={timeframe ?? undefined}
                onValueChange={setTimeframe}
              >
                <SelectTrigger className="w-full shadow-none outline-none ring-0 bg-white ">
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
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
