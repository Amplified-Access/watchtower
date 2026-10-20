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

// A 3:2 tile, the usual shape for a KPI card, kept at every width so the
// row doesn't morph as the content card resizes (the sidebar opening and
// closing). The title sits at the top and the figure at the bottom, so the
// height reads as deliberate. The ratio applies inside a <StatsGrid>, whose
// columns are sized so a card is never too narrow for its content at 3:2:
// 136px of content needs 204px of width. The title is text-lg, like
// the other dashboard cards' titles. On one column (a narrow container)
// the card keeps its natural height instead of growing into a tall slab.
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
        "shadow-none gap-4 py-5 @lg:aspect-[3/2] transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer group",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2">
        <CardTitle className="text-lg font-title group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <Icon className="size-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="mt-auto px-5">
        <div className="flex justify-between items-center pb-1">
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
