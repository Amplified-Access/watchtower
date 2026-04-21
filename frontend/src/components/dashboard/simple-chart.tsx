"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  title: string;
  data: ChartData[];
  type?: "bar" | "pie" | "line";
  className?: string;
}

export function SimpleChart({
  title,
  data,
  type = "bar",
  className,
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  const defaultColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-orange-500",
  ];

  if (type === "bar") {
    return (
      <Card className={cn("rounded-md shadow-none", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-title">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        item.color ||
                          defaultColors[index % defaultColors.length]
                      )}
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "pie") {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card className={cn("rounded-md shadow-none", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-title">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {data.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = data
                    .slice(0, index)
                    .reduce((offset, prevItem) => {
                      return offset - (prevItem.value / total) * 100;
                    }, 0);

                  return (
                    <circle
                      key={item.name}
                      cx="50"
                      cy="50"
                      r="15.915"
                      fill="transparent"
                      stroke={`hsl(${(index * 360) / data.length}, 70%, 50%)`}
                      strokeWidth="8"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: `hsl(${
                        (index * 360) / data.length
                      }, 70%, 50%)`,
                    }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
