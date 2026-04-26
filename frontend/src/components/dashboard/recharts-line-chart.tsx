"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  period: string;
  value: number;
}

interface RechartsLineChartProps {
  title: string;
  data: TrendData[];
  currentValue: number;
  currentChange: number;
  timeframe?: string;
  className?: string;
}

const chartConfig = {
  value: {
    label: "Activity",
    color: "#3b82f6", // blue-500 primary color
  },
} satisfies ChartConfig;

export function RechartsLineChart({
  title,
  data,
  currentValue,
  currentChange,
  timeframe = "7w",
  className,
}: RechartsLineChartProps) {
  const getTrendIcon = () => {
    if (currentChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (currentChange < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (currentChange > 0) return "text-green-600";
    if (currentChange < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendText = () => {
    const absChange = Math.abs(currentChange);
    if (currentChange > 0) return `+${absChange}%`;
    if (currentChange < 0) return `-${absChange}%`;
    return "0%";
  };

  return (
    <Card className={cn("rounded-md shadow-none ", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-title">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {/* <Badge variant="outline" className="text-xs">
            <div className={cn("flex items-center space-x-1", getTrendColor())}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{getTrendText()}</span>
            </div>
          </Badge> */}
        </div>
      </CardHeader>
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Showing activity over the last {timeframe}
      </div>
      <CardContent className="ps-0 ">
        {data.length === 0 ? (
          <div className="h-50 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full ">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                left: 0,
                right: 6,
              }}
              className=""
            >
              <CartesianGrid vertical={false} className=" " />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  // Handle different period formats more intelligently
                  if (value.startsWith("Week")) {
                    return `W${value.replace("Week ", "")}`;
                  }
                  if (value.startsWith("Month")) {
                    return `M${value.replace("Month ", "")}`;
                  }
                  if (value.startsWith("Day")) {
                    return `D${value.replace("Day ", "")}`;
                  }
                  // For other formats, take first 6 characters or full value if shorter
                  return value.length > 6 ? value.slice(0, 6) : value;
                }}
                className=""
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}`}
                className="borde"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="value"
                type="linear"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{
                  fill: "#3b82f6",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
