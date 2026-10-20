"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  icon: IconSvgElement;
  description?: string;
  className?: string;
}

// A 3:2 tile, the usual shape for a KPI card, kept at every width so the
// row doesn't morph as the content card resizes (the sidebar opening and
// closing). The title sits at the top and the figure at the bottom, so the
// height reads as deliberate. The ratio applies inside a <StatsGrid>, whose
// columns are sized so a card is never too narrow for its content at 3:2:
// 140px of content needs 210px of width. The title is text-lg, like
// the other dashboard cards' titles. On one column (a narrow container)
// the card keeps its natural height instead of growing into a tall slab.
export function StatsCard({
  title,
  value,
  change,
  icon,
  description,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "@container/stat relative overflow-hidden shadow-none gap-4 py-5 @lg:aspect-[3/2] transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer group",
        className
      )}
    >
      {/* The icon is a watermark: large and faint, in the card's empty
          right-hand middle and bleeding off its edge, under the text. It
          grows with the figure (card 20rem wide) and tints with the title on
          hover. A Hugeicon at its standard stroke (2), heavier than Lucide's
          thin look so the outline reads as a shape; solid variants would need
          Hugeicons Pro. */}
      <HugeiconsIcon
        icon={icon}
        aria-hidden
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 -right-5 size-24 -translate-y-1/2 text-foreground/[0.09] transition-colors group-hover:text-primary/15 @xs/stat:size-32"
      />
      <CardHeader className="relative flex flex-row items-center space-y-0 px-5 pb-2">
        <CardTitle className="text-lg font-title group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative mt-auto px-5">
        {/* The figure is the card's point: 36px, and 48px once the card is
            20rem wide (its own width, so it follows the sidebar). leading-none
            keeps it inside the 3:2 shape on the narrowest cards. */}
        <div className="flex justify-between items-baseline gap-2 pb-1">
          <div className="text-4xl @xs/stat:text-5xl font-bold leading-none tabular-nums">
            {value}
          </div>
          {change && (
            <p
              className={cn(
                "text-xs text-right",
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
