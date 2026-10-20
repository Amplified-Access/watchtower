"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Analytics01Icon,
  File02Icon,
  MapsLocation01Icon,
  SignalIcon,
} from "@hugeicons/core-free-icons";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import { monthOnMonth } from "@/components/dashboard/month-on-month";
import { RechartsLineChart } from "@/components/dashboard/recharts-line-chart";
import { RechartsPieChart } from "@/components/dashboard/recharts-pie-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeploymentsTable } from "@/features/deployments/components/deployments-table";

// How many deployments the home page lists before "View all".
const LIST_LIMIT = 5;

// The admin's home: their organization's deployments, and the reports that
// came through their reporting links (counted by Go).
export default function AdminDashboardContent() {
  const stats = trpc.getOrganizationDeploymentStats.useQuery();
  const deployments = trpc.getOrganizationDeployments.useQuery();

  if (stats.isLoading || deployments.isLoading) {
    return (
      <Container size="lg" className="space-y-6 pb-6">
        <StatsGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="h-36 animate-pulse shadow-none @lg:aspect-[3/2] @lg:h-auto"
            />
          ))}
        </StatsGrid>
        <Card className="h-72 animate-pulse shadow-none" />
      </Container>
    );
  }

  if (stats.error || deployments.error || !stats.data) {
    return (
      <Container size="lg" className="pb-6">
        <p className="py-12 text-center text-red-500">
          Couldn&apos;t load your deployments. Please try again.
        </p>
      </Container>
    );
  }

  const s = stats.data;
  const c = s.deployments;
  const recent = (deployments.data ?? []).slice(0, LIST_LIMIT);

  return (
    <Container size="lg" className="space-y-6 pb-6">
      <StatsGrid>
        <StatsCard
          title="Deployments"
          value={c.total}
          icon={MapsLocation01Icon}
          description={`${c.draft} draft · ${c.closed} closed`}
        />
        <StatsCard
          title="Live"
          value={c.live}
          icon={SignalIcon}
          description="Taking reports now"
        />
        <StatsCard
          title="Reports This Month"
          value={s.reports.current}
          icon={Analytics01Icon}
          change={monthOnMonth(s.reports)}
          description="Through your reporting links"
        />
        <StatsCard
          title="All Reports"
          value={s.totalReports}
          icon={File02Icon}
          description="Since your first deployment"
        />
      </StatsGrid>

      {s.totalReports > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RechartsPieChart
            title="Reports by Incident Type"
            data={s.byType.map((t) => ({ name: t.name, value: t.count }))}
          />
          <RechartsLineChart
            title="Reports per Week"
            data={s.weekly.map((w) => ({ period: w.week, value: w.count }))}
            currentValue={s.reports.current}
            currentChange={Math.round(s.reports.percentage)}
            timeframe="7w"
          />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-title text-lg font-semibold">Your deployments</h2>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link href="/admin/deployments">
              {c.total > 0 ? "View all" : "Create one"}
            </Link>
          </Button>
        </div>
        <DeploymentsTable
          deployments={recent}
          emptyMessage={
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-foreground">No deployments yet</p>
                <p>
                  A deployment is a map of your own: choose what it tracks and
                  where, then share its reporting link.
                </p>
              </div>
              <Button asChild>
                <Link href="/admin/deployments">
                  <Plus className="h-4 w-4" />
                  Create your first deployment
                </Link>
              </Button>
            </div>
          }
        />
      </section>
    </Container>
  );
}
