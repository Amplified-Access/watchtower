"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "shadow-none rounded-md transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer group",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-title group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center pb-4">
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <p
              className={cn(
                "text-xs",
                change.type === "increase" && "text-green-600",
                change.type === "decrease" && "text-red-600",
                change.type === "neutral" && "text-muted-foreground"
              )}
            >
              {change.value}
            </p>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
