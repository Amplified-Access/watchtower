"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface RechartsPieChartProps {
  title: string;
  data: ChartData[];
  className?: string;
}

const CHART_COLORS = [
  "#0ea5e9", // sky-500 (chart-1)
  "#10b981", // emerald-500 (chart-2)
  "#f59e0b", // amber-500 (chart-3)
  "#ef4444", // red-500 (chart-4)
  "#8b5cf6", // violet-500 (chart-5)
  "#f97316", // orange-500 (chart-6)
  "#06b6d4", // cyan-500 (chart-7)
  "#84cc16", // lime-500 (chart-8)
];

export function RechartsPieChart({
  title,
  data,
  className,
}: RechartsPieChartProps) {
  const id = "org-type-pie-chart";

  // Prepare chart data with proper keys and colors
  const chartData = React.useMemo(
    () =>
      data.map((item, index) => ({
        type: item.name,
        count: item.value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [data]
  );

  // Create dynamic chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Organizations",
      },
    };

    data.forEach((item, index) => {
      const key = item.name.toLowerCase().replace(/\s+/g, "-");
      config[key] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return config;
  }, [data]);

  const [activeType, setActiveType] = React.useState(
    chartData.length > 0 ? chartData[0].type : ""
  );

  // ActiveIndex should directly follow the activeType (selector value)
  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.type === activeType),
    [activeType, chartData]
  );

  // ActiveItem should follow the current activeType
  const activeItem = React.useMemo(
    () => chartData.find((item) => item.type === activeType) || chartData[0],
    [activeType, chartData]
  );

  const types = React.useMemo(
    () => chartData.map((item) => item.type),
    [chartData]
  );

  if (data.length === 0) {
    return (
      <Card className={cn("rounded-md shadow-none", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-title">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card
      data-chart={id}
      className={cn("flex flex-col rounded-md shadow-none", className)}
    >
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-title">{title}</CardTitle>
        </div>
        {types.length > 1 && (
          <Select value={activeType} onValueChange={setActiveType}>
            <SelectTrigger
              className="ml-auto h-7 w-32.5 rounded-lg pl-2.5"
              aria-label="Select organization type"
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {types.map((type) => {
                const typeIndex = types.indexOf(type);
                const color = CHART_COLORS[typeIndex % CHART_COLORS.length];

                return (
                  <SelectItem
                    key={type}
                    value={type}
                    className="rounded-lg [&_span]:flex"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-xs"
                        style={{
                          backgroundColor: color,
                        }}
                      />
                      {type}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0 ">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-75 "
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
              {...({ activeIndex } as any)}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
              onMouseEnter={(data, index) => {
                if (data && 'type' in data && data.type) {
                  setActiveType(data.type as string);
                }
              }}
              onMouseLeave={() => {
                // Optional: Could revert to first item or keep current selection
                // For now, keep the current selection
              }}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {activeItem?.count.toLocaleString() || "0"}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Organizations
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
