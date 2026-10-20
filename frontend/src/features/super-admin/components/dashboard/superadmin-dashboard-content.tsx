"use client";

import Link from "next/link";
import {
  Building03Icon,
  MapsLocation01Icon,
  Megaphone01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import { monthOnMonth } from "@/components/dashboard/month-on-month";
import { QuickOverview } from "@/components/dashboard/quick-overview";
import { RechartsLineChart } from "@/components/dashboard/recharts-line-chart";
import { RechartsPieChart } from "@/components/dashboard/recharts-pie-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Card } from "@/components/ui/card";
import { MostActiveDeployments } from "./most-active-deployments";

// How many applications the home page lists.
const LIST_LIMIT = 5;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

// The super admin's home, on the deployments model: organizations and the
// deployments they run (the busiest this month), the public reports coming
// in, and the applications waiting for review.
export default function SuperAdminDashboardContent() {
  const stats = trpc.getDashboardStats.useQuery();
  const applications = trpc.getPendingApplications.useQuery({
    limit: LIST_LIMIT,
  });
  const reportsByType = trpc.getOrganizationTypeDistribution.useQuery();
  const reportsTrend = trpc.getPlatformActivityTrend.useQuery();

  if (stats.isLoading) {
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-72 animate-pulse shadow-none" />
          <Card className="h-72 animate-pulse shadow-none" />
        </div>
      </Container>
    );
  }

  if (stats.error || !stats.data) {
    return (
      <Container size="lg" className="pb-6">
        <p className="py-12 text-center text-red-500">
          Couldn&apos;t load the platform&apos;s numbers. Please try again.
        </p>
      </Container>
    );
  }

  const s = stats.data;
  const newOrgs = s.growth.organizations.current;

  return (
    <Container size="lg" className="space-y-6 pb-6">
      <StatsGrid>
        <Link href="/superadmin/organizations" className="block">
          <StatsCard
            title="Organizations"
            value={s.totalOrganizations}
            icon={Building03Icon}
            change={{
              value: newOrgs > 0 ? `+${newOrgs} this month` : "None new this month",
              type: newOrgs > 0 ? "increase" : "neutral",
            }}
            description="Approved to run deployments"
          />
        </Link>
        <Link href="/superadmin/deployments" className="block">
          <StatsCard
            title="Deployments"
            value={s.deployments.total}
            icon={MapsLocation01Icon}
            change={{
              value: `${s.deployments.live} live`,
              type: s.deployments.live > 0 ? "increase" : "neutral",
            }}
            description={`${s.deployments.draft} draft · ${s.deployments.closed} closed`}
          />
        </Link>
        <StatsCard
          title="Public Reports"
          value={s.reports.current}
          icon={Megaphone01Icon}
          change={monthOnMonth(s.reports)}
          description="This month, across the platform"
        />
        <Link href="/superadmin/applications" className="block">
          <StatsCard
            title="Applications"
            value={s.pendingApplications}
            icon={UserAdd01Icon}
            change={{
              value: s.pendingApplications > 0 ? "Awaiting review" : "All reviewed",
              type: "neutral",
            }}
            description="Organizations waiting to join"
          />
        </Link>
      </StatsGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MostActiveDeployments deployments={s.mostActiveDeployments} />
        <QuickOverview
          title="Pending Applications"
          items={(applications.data ?? []).slice(0, LIST_LIMIT).map((a) => ({
            id: String(a.id),
            title: a.organizationName || "New application",
            status: a.status,
            date: formatDate(a.createdAt),
          }))}
          emptyMessage="No pending applications"
          viewAllHref="/superadmin/applications"
          enableActions
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RechartsPieChart
          title="Public Reports by Incident Type"
          data={reportsByType.data ?? []}
        />
        <RechartsLineChart
          title="Public Reports per Week"
          data={(reportsTrend.data?.data ?? []).map((d) => ({
            period: d.week,
            value: d.count,
          }))}
          currentValue={reportsTrend.data?.currentValue ?? 0}
          currentChange={reportsTrend.data?.currentChange ?? 0}
          timeframe={reportsTrend.data?.timeframe ?? "7w"}
        />
      </div>
    </Container>
  );
}
