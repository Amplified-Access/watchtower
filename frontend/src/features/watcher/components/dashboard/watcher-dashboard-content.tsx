"use client";

import { trpc } from "@/_trpc/client";
import { useExtendedSession } from "@/hooks/use-extended-session";
import PageLoader from "@/components/common/page-loader";
import Container from "@/components/common/container";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickOverview } from "@/components/dashboard/quick-overview";
import { RechartsLineChart } from "@/components/dashboard/recharts-line-chart";
import {
  AlertTriangle,
  FileText,
  FormInput,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WatcherDashboardContent() {
  const { user, isLoading: userLoading } = useExtendedSession();

  // Fetch dashboard data
  const { data: activeForms, isLoading: formsLoading } =
    trpc.getActiveFormsForWatcher.useQuery();
  const { data: organizationData, isLoading: orgLoading } =
    trpc.getAdminOrganization.useQuery(
      { userId: user?.id || "" },
      { enabled: !!user?.id },
    );

  // Fetch real dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } =
    trpc.getOrganizationDashboardStats.useQuery(undefined, {
      enabled: !!user?.organizationId,
    });

  // Fetch real recent activity
  const { data: recentActivity = [], isLoading: activityLoading } =
    trpc.getOrganizationRecentActivity.useQuery(
      { limit: 10 },
      { enabled: !!user?.id },
    );

  // Fetch user's organization incident reports
  const { data: myIncidentReports, isLoading: incidentReportsLoading } =
    trpc.organizationReports.getUserOrganizationIncidentReports.useQuery(
      {
        limit: 5,
        offset: 0,
      },
      { enabled: !!user?.id },
    );

  const isLoading =
    userLoading ||
    formsLoading ||
    orgLoading ||
    statsLoading ||
    activityLoading ||
    incidentReportsLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  const totalForms = Array.isArray(activeForms) ? activeForms.length : 0;

  // Transform incident reports for display
  const myIncidents = (myIncidentReports?.reports || []).map((report: any) => ({
    id: report.id,
    title: `${report.incidentTypeName} Incident`,
    status: report.verified ? "resolved" : "reported",
    date: new Date(report.createdAt).toLocaleDateString(),
    type: report.incidentTypeName || "General Incident",
    href: `/watcher/incidents/${report.id}`,
  }));

  // Available forms from the database (already fetched)
  const availableForms = (activeForms || []).map((form) => ({
    id: form.id,
    title: form.name,
    status: "active",
    date: "Available",
    type: "Active Form",
    href: `/watcher/forms/${form.id}`,
  }));

  return (
    <div className="flex-1 space-y-6 py-4 md:p-6">
      <Container size="lg" className="space-y-6">
        {/* Welcome Section */}
        <div className="flex md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-title pb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground">
              Manage incidents for your organization.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="text-sm font-medium">
                {organizationData && "organization" in organizationData
                  ? organizationData.organization
                  : "Your Organization"}
              </p>
            </div>
            <Button asChild size={"sm"}>
              <Link href="/watcher/incidents/new" className="text-sm">
                Quick Report
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Available Forms"
            value={totalForms}
            icon={FormInput}
            description="Forms ready for reporting"
          />
          <StatsCard
            title="My Reports Today"
            value={dashboardStats?.incidents?.open || 0}
            icon={FileText}
            change={{
              value: "Open incidents",
              type: "neutral",
            }}
            description="Reports submitted today"
          />
          <StatsCard
            title="Pending Actions"
            value={
              myIncidents.filter((i: any) => i.status === "reported").length
            }
            icon={Clock}
            change={{
              value: "Awaiting review",
              type: "neutral",
            }}
            description="Items requiring attention"
          />
          <StatsCard
            title="Completion Rate"
            value={`${
              myIncidents.filter((i: any) => i.status === "resolved").length
            }/${myIncidents.length || 1}`}
            icon={CheckCircle}
            change={{
              value: "This week",
              type: "neutral",
            }}
            description="Task completion rate"
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
              title="Your Recent Activity"
            />

          </div>

          {/* Quick Actions */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-title text-lg">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  href: "/watcher/forms",
                  icon: FormInput,
                  label: "Submit New Report",
                },
                {
                  href: "/watcher/incidents",
                  icon: AlertTriangle,
                  label: "View My Incidents",
                },
                {
                  href: "/watcher/reports",
                  icon: FileText,
                  label: "View Reports",
                },
                {
                  href: "/watcher/reports/new",
                  icon: FileText,
                  label: "Create Report",
                },
                {
                  href: "/watcher/inbox",
                  icon: Building2,
                  label: "Check Messages",
                },
              ].map(({ href, icon: Icon, label }, idx) => (
                <Button
                  asChild
                  className="w-full justify-start"
                  variant="outline"
                  key={idx}
                >
                  <Link href={href} className="">
                    <div className="flex items-center w-40 mx-auto text-sm">
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </div>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Overview Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickOverview
            title="My Recent Incidents"
            items={myIncidents}
            emptyMessage="No recent incidents"
            viewAllHref="/watcher/incidents"
          />
          <QuickOverview
            title="Available Forms"
            items={availableForms}
            emptyMessage="No forms available"
            viewAllHref="/watcher/forms"
          />
        </div>

        {/* Activity Chart - Full Width */}
        <div className="w-full">
          <RechartsLineChart
            title="My Activity This Week"
            data={(() => {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const counts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
              const now = new Date();
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - now.getDay());
              weekStart.setHours(0, 0, 0, 0);
              recentActivity.forEach((a) => {
                const d = new Date(a.timestamp);
                if (d >= weekStart) counts[days[d.getDay()]]++;
              });
              return days.map((d) => ({ period: d, value: counts[d] }));
            })()}
            currentValue={recentActivity.length}
            currentChange={0}
            timeframe="7d"
          />
        </div>
      </Container>
    </div>
  );
}
