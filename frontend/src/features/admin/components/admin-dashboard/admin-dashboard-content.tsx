"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Archive01Icon,
  MapsLocation01Icon,
  PencilEdit01Icon,
  SignalIcon,
} from "@hugeicons/core-free-icons";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeploymentsTable } from "@/features/deployments/components/deployments-table";

// How many deployments the home page lists before "View all".
const LIST_LIMIT = 5;

// The admin's home, on the deployments model: their organization's
// deployments, by status and newest first. Report numbers per deployment
// come once reports are tagged with the deployment they arrive through.
export default function AdminDashboardContent() {
  const counts = trpc.getOrganizationDeploymentCounts.useQuery();
  const deployments = trpc.getOrganizationDeployments.useQuery();

  if (counts.isLoading || deployments.isLoading) {
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

  if (counts.error || deployments.error || !counts.data) {
    return (
      <Container size="lg" className="pb-6">
        <p className="py-12 text-center text-red-500">
          Couldn&apos;t load your deployments. Please try again.
        </p>
      </Container>
    );
  }

  const c = counts.data;
  const recent = (deployments.data ?? []).slice(0, LIST_LIMIT);

  return (
    <Container size="lg" className="space-y-6 pb-6">
      <StatsGrid>
        <StatsCard
          title="Deployments"
          value={c.total}
          icon={MapsLocation01Icon}
          description="Your organization's maps"
        />
        <StatsCard
          title="Live"
          value={c.live}
          icon={SignalIcon}
          description="Taking reports now"
        />
        <StatsCard
          title="Drafts"
          value={c.draft}
          icon={PencilEdit01Icon}
          description="Being set up"
        />
        <StatsCard
          title="Closed"
          value={c.closed}
          icon={Archive01Icon}
          description="Finished"
        />
      </StatsGrid>

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
