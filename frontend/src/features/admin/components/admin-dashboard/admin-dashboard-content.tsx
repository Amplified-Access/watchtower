"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickOverview } from "@/components/dashboard/quick-overview";
import { RechartsPieChart } from "@/components/dashboard/recharts-pie-chart";
import { RechartsLineChart } from "@/components/dashboard/recharts-line-chart";
import {
  Users,
  Shield,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  FormInput,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardContent() {
  const { user, isLoading: userLoading } = useExtendedSession();

  // Fetch dashboard data
  const { data: watchers, isLoading: watchersLoading } =
    trpc.getOrganizationWatchers.useQuery();
  const { data: forms, isLoading: formsLoading } =
    trpc.getAllOrganizationFormsByOrganizationId.useQuery(
      { organizationId: user?.organizationId || "" },
      { enabled: !!user?.organizationId }
    );
  const { data: organizationData, isLoading: orgLoading } =
    trpc.getAdminOrganization.useQuery(
      { userId: user?.id || "" },
      { enabled: !!user?.id }
    );

  // Fetch real dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } =
    trpc.getOrganizationDashboardStats.useQuery(undefined, {
      enabled: !!user?.organizationId,
    });

  // Fetch real recent activity
  const { data: recentActivity = [], isLoading: activityLoading } =
    trpc.getOrganizationRecentActivity.useQuery(
      { limit: 10 },
      { enabled: !!user?.organizationId }
    );

  // Fetch real recent incidents
  const { data: recentIncidents = [], isLoading: incidentsLoading } =
    trpc.getOrganizationRecentIncidents.useQuery(
      { limit: 5 },
      { enabled: !!user?.organizationId }
    );

  // Fetch real pending reports
  const { data: pendingReports = [], isLoading: reportsLoading } =
    trpc.getOrganizationPendingReports.useQuery(
      { limit: 5 },
      { enabled: !!user?.organizationId }
    );

  // Fetch analytics data
  const { data: incidentTypesAnalytics = [] } =
    trpc.getOrganizationIncidentTypesAnalytics.useQuery();
  const { data: weeklyTrendData } =
    trpc.getOrganizationWeeklyIncidentTrend.useQuery();

  const isLoading =
    userLoading ||
    watchersLoading ||
    formsLoading ||
    orgLoading ||
    statsLoading ||
    activityLoading ||
    incidentsLoading ||
    reportsLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  const totalWatchers = dashboardStats?.watchers.total || 0;
  const totalForms = dashboardStats?.forms.total || 0;
  const activeForms = dashboardStats?.forms.active || 0;
  const totalIncidents = dashboardStats?.incidents.total || 0;
  const openIncidents = dashboardStats?.incidents.open || 0;

  return (
    <div className="flex-1 space-y-6 py-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-title pb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground">
              Here's your organization's overview for today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Organization</p>
            <p className="text-sm font-medium">
              {organizationData && "organization" in organizationData
                ? organizationData.organization
                : "Your Organization"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Watchers"
            value={totalWatchers}
            icon={Users}
            change={{
              value: "+2 this week",
              type: "increase",
            }}
            description="Field watchers in your organization"
          />
          <StatsCard
            title="Total Incidents"
            value={totalIncidents}
            icon={AlertTriangle}
            change={{
              value: `${openIncidents} open`,
              type: openIncidents > 0 ? "increase" : "neutral",
            }}
            description="Total incidents reported"
          />
          <StatsCard
            title="Active Forms"
            value={`${activeForms}/${totalForms}`}
            icon={FormInput}
            change={{
              value: `${totalForms} total forms`,
              type: "neutral",
            }}
            description="Forms available for reporting"
          />
          <StatsCard
            title="Published Reports"
            value={dashboardStats?.reports.published || 0}
            icon={Activity}
            change={{
              value: `${dashboardStats?.reports.draft || 0} drafts`,
              type: "neutral",
            }}
            description="Reports published this month"
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
                type: a.type as any,
              }))}
              title="Organization Recent Activity"
            />

          </div>

          {/* Organization Overview */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title">
                Organization Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <span className="text-sm text-muted-foreground">
                  {totalWatchers + 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Forms Deployed</span>
                <span className="text-sm text-muted-foreground">
                  {activeForms} active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reports This Month</span>
                <span className="text-sm text-muted-foreground">
                  {dashboardStats?.reports.published || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Open Incidents</span>
                <span className="text-sm text-muted-foreground">
                  {openIncidents}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickOverview
            title="Recent Incidents"
            items={recentIncidents.map((i) => ({
              ...i,
              title: `Incident ${i.id.slice(0, 8)}`,
              date: i.createdAt,
            }))}
            emptyMessage="No recent incidents"
            viewAllHref="/admin/incidents"
          />
          <QuickOverview
            title="Pending Reports"
            items={pendingReports.map((r) => ({
              ...r,
              title: r.formName || `Report ${r.id.slice(0, 8)}`,
              date: r.createdAt,
            }))}
            emptyMessage="No pending reports"
            viewAllHref="/admin/reports"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RechartsPieChart
            title="Incident Types This Month"
            data={incidentTypesAnalytics}
          />
          <RechartsLineChart
            title="Weekly Incident Trend"
            data={(weeklyTrendData?.data || []).map((d) => ({
              period: d.week,
              value: d.count,
            }))}
            currentValue={weeklyTrendData?.currentValue || 0}
            currentChange={weeklyTrendData?.currentChange || 0}
            timeframe={weeklyTrendData?.timeframe || "7d"}
          />
        </div>
      </Container>
    </div>
  );
}
