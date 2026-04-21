"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SimpleChart } from "./simple-chart";
import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  period: string;
  value: number;
  change?: number;
}

interface InteractiveDataProps {
  title: string;
  data: TrendData[];
  currentValue: number;
  currentChange: number;
  timeframe?: "7d" | "30d" | "90d" | "1y";
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

export function InteractiveData({
  title,
  data,
  currentValue,
  currentChange,
  timeframe = "30d",
  onTimeframeChange,
  className,
}: InteractiveDataProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value as typeof timeframe);
    onTimeframeChange?.(value);
  };

  const getTrendIcon = () => {
    if (currentChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (currentChange < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (currentChange > 0) return "text-green-600";
    if (currentChange < 0) return "text-red-600";
    return "text-gray-500";
  };

  const chartData = data.map((item) => ({
    name: item.period,
    value: item.value,
  }));

  return (
    <Card className={cn("shadow-none rounded-md",className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-title">{title}</CardTitle>
        <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-3">
          <div className="text-3xl font-bold">{currentValue}</div>
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(currentChange)}%
            </span>
            <span className="text-sm text-muted-foreground">
              vs previous period
            </span>
          </div>
        </div>

        {/* Simple trend visualization */}
        <div className="mt-4">
          <div className="flex items-end space-x-1 h-16">
            {chartData.slice(-7).map((item, index) => {
              const maxValue = Math.max(
                ...chartData.slice(-7).map((d) => d.value)
              );
              const height = (item.value / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full bg-blue-500 rounded-t transition-all duration-300 ${
                      index === chartData.slice(-7).length - 1
                        ? "bg-blue-600"
                        : "bg-blue-400"
                    }`}
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Average: </span>
            <span className="font-medium">
              {Math.round(
                data.reduce((sum, item) => sum + item.value, 0) / data.length
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Peak: </span>
            <span className="font-medium">
              {Math.max(...data.map((item) => item.value))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
