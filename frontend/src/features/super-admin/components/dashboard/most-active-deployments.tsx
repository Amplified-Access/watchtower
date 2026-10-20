import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats } from "@/lib/api/admin";

// The deployments that gathered the most reports this month, busiest first,
// as Go ranks them. Each links to its public map.
export function MostActiveDeployments({
  deployments,
}: {
  deployments: PlatformStats["mostActiveDeployments"];
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-title text-lg">Most Active Deployments</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-sm font-medium text-primary">
          <Link href="/superadmin/deployments">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deployments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No reports through a deployment this month
          </p>
        ) : (
          <ol className="divide-y overflow-hidden rounded-lg border">
            {deployments.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/d/${d.slug}`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-card/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.organizationName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-title text-lg font-semibold tabular-nums">
                      {d.reportsThisMonth}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {d.totalReports} in all
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
