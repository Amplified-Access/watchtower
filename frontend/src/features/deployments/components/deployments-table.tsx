"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/_trpc/client";
import { cn } from "@/lib/utils";

type Deployment = RouterOutputs["getAllDeployments"][number];

const statusStyles: Record<Deployment["status"], string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  live: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-muted-foreground/10 text-muted-foreground border-transparent",
};

// How many of a deployment's incident types are named before "+N".
const NAMED_TYPES = 2;

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { timeZone: "UTC" }) : null;

// The deployments list shared by the admin (their own) and the super admin
// (everyone's, with an Organization column). A flush card, in the
// dashboards' card style.
export function DeploymentsTable({
  deployments,
  showOrganization = false,
  emptyMessage,
}: {
  deployments: Deployment[];
  showOrganization?: boolean;
  emptyMessage: React.ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      {deployments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deployment</TableHead>
              {showOrganization && <TableHead>Organization</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Theme</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployments.map((d) => {
              const starts = formatDate(d.startsAt);
              const ends = formatDate(d.endsAt);
              const area = [d.region, d.country].filter(Boolean).join(", ");
              const named = d.incidentTypes.slice(0, NAMED_TYPES);
              const more = d.incidentTypes.length - named.length;
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="font-medium">{d.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      /{d.slug}
                    </p>
                  </TableCell>
                  {showOrganization && (
                    <TableCell>{d.organizationName}</TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", statusStyles[d.status])}
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex flex-wrap items-center gap-x-3 gap-y-1"
                      title={d.incidentTypes.map((t) => t.name).join(", ")}
                    >
                      {named.map((t) => (
                        <span key={t.id} className="flex items-center gap-1.5 text-sm">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +{more}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {area || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {starts || ends
                      ? `${starts ?? "…"} – ${ends ?? "…"}`
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(d.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
