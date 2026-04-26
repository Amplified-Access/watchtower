"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import Loader from "@/components/common/loader";
import Container from "@/components/common/container";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickOverview } from "@/components/dashboard/quick-overview";
import { RechartsPieChart } from "@/components/dashboard/recharts-pie-chart";
import { RechartsLineChart } from "@/components/dashboard/recharts-line-chart";
import { Building2, Shield, Eye, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SuperAdminDashboardContent() {
  const { user, isLoading: userLoading } = useExtendedSession();

  // Fetch dashboard data from our new endpoints
  const { data: dashboardStats, isLoading: statsLoading } =
    trpc.getDashboardStats.useQuery();
  const { data: recentActivity, isLoading: activityLoading } =
    trpc.getRecentActivity.useQuery({ limit: 5 });
  const { data: pendingApplications, isLoading: applicationsLoading } =
    trpc.getPendingApplications.useQuery({ limit: 5 });
  const { data: criticalIncidents, isLoading: incidentsLoading } =
    trpc.getCriticalIncidents.useQuery({ limit: 5 });
  const { data: organizationTypes, isLoading: typesLoading } =
    trpc.getOrganizationTypeDistribution.useQuery();
  const { data: activityTrend, isLoading: trendLoading } =
    trpc.getPlatformActivityTrend.useQuery();

  const isLoading =
    userLoading ||
    statsLoading ||
    activityLoading ||
    applicationsLoading ||
    incidentsLoading ||
    typesLoading ||
    trendLoading;

  if (isLoading) {
    return (
      <div className="py-6">
        <Container size="lg" className="space-y-6">
          {/* Welcome Section Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-muted rounded-md animate-pulse mb-2" />
              <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-3 w-20 bg-muted rounded-md animate-pulse mb-1" />
              <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-md shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-muted rounded-md animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded-md animate-pulse" />
                    <div className="h-3 w-32 bg-muted rounded-md animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity Skeleton - spans 2 columns */}
            <div className="lg:col-span-2">
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
                        <div className="h-3 w-3/4 bg-muted rounded-md animate-pulse" />
                      </div>
                      <div className="h-3 w-16 bg-muted rounded-md animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* System Overview Skeleton */}
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-12 bg-muted rounded-md animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="rounded-md shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-6 w-40 bg-muted rounded-md animate-pulse" />
                  <div className="h-8 w-20 bg-muted rounded-md animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
                        <div className="h-3 w-2/3 bg-muted rounded-md animate-pulse" />
                      </div>
                      <div className="h-3 w-12 bg-muted rounded-md animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Section Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart Skeleton */}
            <Card className="rounded-md shadow-none flex flex-col">
              <CardHeader className="flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                  <div className="h-6 w-40 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="ml-auto h-7 w-32 bg-muted rounded-lg animate-pulse" />
              </CardHeader>
              <CardContent className="flex flex-1 justify-center pb-0">
                <div className="mx-auto aspect-square w-full max-w-75 flex items-center justify-center">
                  <div className="h-62.5 w-62.5 bg-muted rounded-full animate-pulse" />
                </div>
              </CardContent>
            </Card>

            {/* Line Chart Skeleton */}
            <Card className="rounded-md shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-6 w-44 bg-muted rounded-md animate-pulse" />
                <div className="h-6 w-12 bg-muted rounded-md animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-16 bg-muted rounded-md animate-pulse" />
                  <div className="flex items-center space-x-1">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-12 bg-muted rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="h-50 w-full bg-muted rounded-md animate-pulse" />
                <div className="mt-4 h-3 w-64 bg-muted rounded-md animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  const stats = dashboardStats || {
    totalOrganizations: 0,
    totalAdmins: 0,
    totalWatchers: 0,
    pendingApplications: 0,
    reportsThisMonth: 0,
    activeForms: 0,
    criticalIncidents: 0,
    uptimePercentage: 99.9,
    growth: {
      organizations: { current: 0, previous: 0, percentage: 0 },
      admins: { current: 0, previous: 0, percentage: 0 },
      watchers: { current: 0, previous: 0, percentage: 0 },
    },
    metrics: {
      newOrganizationsThisMonth: 0,
      newAdminsThisMonth: 0,
      newWatchersThisMonth: 0,
      averageReportsPerOrg: 0,
    },
  };

  // Helper function to format growth text
  const formatGrowthText = (growth: {
    current: number;
    previous: number;
    percentage: number;
  }) => {
    if (growth.current === 0 && growth.previous === 0) {
      return "No data yet";
    }
    if (growth.percentage === 0) {
      return "No change this month";
    }
    const sign = growth.percentage > 0 ? "+" : "";
    return `${sign}${growth.percentage}% this month`;
  };

  // Helper function to determine growth type
  const getGrowthType = (
    percentage: number
  ): "increase" | "decrease" | "neutral" => {
    if (percentage > 0) return "increase";
    if (percentage < 0) return "decrease";
    return "neutral";
  };

  return (
    <div className="py-6">
      <Container size="lg" className="space-y-6">
        {/* Welcome Section */}
        <div className="flex md:items-center justify-between gap-16">
          <div>
            <h1 className="text-2xl font-bold font-title tracking-tight pb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening across all organizations today.
            </p>
          </div>
          <div className="text-right text-nowrap">
            <p className="text-sm text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/superadmin/organizations" className="block">
            <StatsCard
              title="Organizations"
              value={stats.totalOrganizations}
              icon={Building2}
              change={{
                value: formatGrowthText(stats.growth.organizations),
                type: getGrowthType(stats.growth.organizations.percentage),
              }}
              description="Organizations on the platform"
            />
          </Link>
          <Link href="/superadmin/admins" className="block">
            <StatsCard
              title="Admins"
              value={stats.totalAdmins}
              icon={Shield}
              change={{
                value: formatGrowthText(stats.growth.admins),
                type: getGrowthType(stats.growth.admins.percentage),
              }}
              description="Organization administrators"
            />
          </Link>
          <Link href="/superadmin/watchers" className="block">
            <StatsCard
              title="Users"
              value={stats.totalWatchers}
              icon={Eye}
              change={{
                value: formatGrowthText(stats.growth.watchers),
                type: getGrowthType(stats.growth.watchers.percentage),
              }}
              description="Field watchers across all orgs"
            />
          </Link>

          <StatsCard
            title="Platform Health"
            value={`${stats.uptimePercentage}%`}
            icon={Activity}
            change={{
              value: "Last 30 days",
              type:
                stats.uptimePercentage >= 99.5
                  ? "increase"
                  : stats.uptimePercentage >= 98
                  ? "neutral"
                  : "decrease",
            }}
            description="System uptime"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - spans 2 columns */}
          <div className="lg:col-span-2">
            <RecentActivity
              activities={(recentActivity || []).map((a) => ({
                ...a,
                title: a.description,
              }))}
              title="Recent Platform Activity"
            />
          </div>

          {/* System Overview */}
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title">
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Users</span>
                <span className="text-sm text-muted-foreground">
                  {stats.totalAdmins + stats.totalWatchers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New This Month</span>
                <span className="text-sm text-blue-600 font-medium">
                  +
                  {stats.metrics.newOrganizationsThisMonth +
                    stats.metrics.newAdminsThisMonth +
                    stats.metrics.newWatchersThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Pending Applications
                </span>
                <span
                  className={`text-sm font-medium ${
                    stats.pendingApplications > 0
                      ? "text-orange-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {stats.pendingApplications}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reports This Month</span>
                <span className="text-sm text-muted-foreground">
                  {stats.reportsThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Reports/Org</span>
                <span className="text-sm text-muted-foreground">
                  {stats.metrics.averageReportsPerOrg}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Forms</span>
                <span className="text-sm text-muted-foreground">
                  {stats.activeForms}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical Incidents</span>
                <span
                  className={`text-sm font-medium ${
                    stats.criticalIncidents > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {stats.criticalIncidents > 0
                    ? stats.criticalIncidents
                    : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Platform Health</span>
                <span
                  className={`text-sm font-medium ${
                    stats.uptimePercentage >= 99.5
                      ? "text-green-600"
                      : stats.uptimePercentage >= 98
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.uptimePercentage}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickOverview
            title="Pending Applications"
            items={(pendingApplications || []).map((a) => ({
              ...a,
              id: String(a.id),
              title: (a as any).organizationName || "New Application",
              date: (a as any).createdAt,
            }))}
            emptyMessage="No pending applications"
            viewAllHref="/superadmin/applications"
            enableActions={true}
          />
          <QuickOverview
            title="Critical Incidents"
            items={(criticalIncidents || []).map((i) => ({
              ...i,
              title: `Incident ${i.id.slice(0, 8)}`,
              date: i.createdAt,
            }))}
            emptyMessage="No critical incidents"
            viewAllHref="/superadmin/incidents"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RechartsPieChart
            title="Organizations by Type"
            data={organizationTypes || []}
          />
          <RechartsLineChart
            title="Platform Activity Trend"
            data={(activityTrend?.data || []).map((d: any) => ({
              period: d.week || d.period,
              value: d.count || d.value,
            }))}
            currentValue={activityTrend?.currentValue || 0}
            currentChange={activityTrend?.currentChange || 0}
            timeframe={activityTrend?.timeframe || "7w"}
          />
        </div>
      </Container>
    </div>
  );
}
