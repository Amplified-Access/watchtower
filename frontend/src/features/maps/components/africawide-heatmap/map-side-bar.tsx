import * as React from "react";
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
import { cn } from "@/lib/utils";
import { BsIncognito } from "react-icons/bs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQueryState, parseAsInteger } from "nuqs";

// Define actual incident types based on the real data
const incidentTypes = [
  {
    name: "Violence against civilians",
    key: "violence_civilians",
    min: 0,
    max: 150,
    defaultValue: 0,
  },
  { name: "Battles", key: "battles", min: 0, max: 100, defaultValue: 0 },
  {
    name: "Strategic developments",
    key: "strategic",
    min: 0,
    max: 50,
    defaultValue: 0,
  },
  {
    name: "Explosions/Remote violence",
    key: "explosions",
    min: 0,
    max: 30,
    defaultValue: 0,
  },
  { name: "Protests", key: "protests", min: 0, max: 20, defaultValue: 0 },
  { name: "Riots", key: "riots", min: 0, max: 15, defaultValue: 0 },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Use nuqs for each slider value
  const [violenceCiviliansMin, setViolenceCiviliansMin] = useQueryState(
    "violence_civilians",
    parseAsInteger.withDefault(0)
  );
  const [battlesMin, setBattlesMin] = useQueryState(
    "battles",
    parseAsInteger.withDefault(0)
  );
  const [strategicMin, setStrategicMin] = useQueryState(
    "strategic",
    parseAsInteger.withDefault(0)
  );
  const [explosionsMin, setExplosionsMin] = useQueryState(
    "explosions",
    parseAsInteger.withDefault(0)
  );
  const [protestsMin, setProtestsMin] = useQueryState(
    "protests",
    parseAsInteger.withDefault(0)
  );
  const [riotsMin, setRiotsMin] = useQueryState(
    "riots",
    parseAsInteger.withDefault(0)
  );

  const sliderStates = {
    violence_civilians: {
      value: violenceCiviliansMin,
      setter: setViolenceCiviliansMin,
    },
    battles: { value: battlesMin, setter: setBattlesMin },
    strategic: { value: strategicMin, setter: setStrategicMin },
    explosions: { value: explosionsMin, setter: setExplosionsMin },
    protests: { value: protestsMin, setter: setProtestsMin },
    riots: { value: riotsMin, setter: setRiotsMin },
  };

  // Track local slider values for smooth UI updates before committing to URL
  const [localValues, setLocalValues] = React.useState<Record<string, number>>(
    {}
  );

  const handleSliderChange = (key: string, values: number[]) => {
    // Update local state immediately for smooth UI
    setLocalValues((prev) => ({
      ...prev,
      [key]: values[0],
    }));
  };

  const handleSliderCommit = (key: string, values: number[]) => {
    // Commit to URL state only on mouse release
    const state = sliderStates[key as keyof typeof sliderStates];
    if (state) {
      state.setter(values[0]);
    }
    // Clear local value since it's now committed
    setLocalValues((prev) => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const resetFilters = () => {
    setViolenceCiviliansMin(0);
    setBattlesMin(0);
    setStrategicMin(0);
    setExplosionsMin(0);
    setProtestsMin(0);
    setRiotsMin(0);
    setLocalValues({});
  };

  return (
    <Sidebar {...props} style={{ "--sidebar-width": "24rem" } as any}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <BsIncognito size={24} />
                <span className="font-semibold">Incident Filters</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <div className="pt-4">
            <h4 className="text-lg font-semibold mb-4">
              Filter by Incident Count
            </h4>
            <div className="space-y-6">
              {incidentTypes.map((type) => {
                const committedValue =
                  sliderStates[type.key as keyof typeof sliderStates]?.value ||
                  0;
                const currentValue =
                  localValues[type.key] !== undefined
                    ? localValues[type.key]
                    : committedValue;
                return (
                  <div key={type.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor={`slider-${type.key}`}
                        className="text-sm font-medium"
                      >
                        {type.name}
                      </Label>
                      <span className="text-sm text-gray-500">
                        {currentValue}+ incidents
                      </span>
                    </div>
                    <Slider
                      id={`slider-${type.key}`}
                      min={type.min}
                      max={type.max}
                      value={[currentValue]}
                      onValueChange={(values) =>
                        handleSliderChange(type.key, values)
                      }
                      onValueCommit={(values) =>
                        handleSliderCommit(type.key, values)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{type.min}</span>
                      <span>{type.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
