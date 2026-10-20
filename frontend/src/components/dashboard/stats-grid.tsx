import type { ReactNode } from "react";

// The row of StatsCards at the top of a dashboard. Columns follow the
// grid's own width (container queries), not the viewport's, since the
// content card's width also changes with the sidebar: one column, two once
// each card gets ~250px, four from a 64rem container (cards ~244px). Those
// steps keep every card wide enough for its content at 3:2, and for its
// text-lg title ("Published Reports") on one line.
export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="@container">
      <div className="grid gap-4 @lg:grid-cols-2 @5xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}
