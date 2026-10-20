"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type Status = Deployment["status"];

// What changing a deployment's status is called, from where it is.
const statusActions: Record<Status, { to: Status; label: string }[]> = {
  draft: [{ to: "live", label: "Go live" }],
  live: [
    { to: "closed", label: "Close" },
    { to: "draft", label: "Move back to draft" },
  ],
  closed: [{ to: "live", label: "Reopen" }],
};

const reportingLink = (slug: string) => `${window.location.origin}/d/${slug}/report`;

// The deployments list shared by the admin (their own) and the super admin
// (everyone's, with an Organization column). A flush card, in the
// dashboards' card style. Each row's menu opens its public map once it
// isn't a draft (a draft's pages aren't public); given onStatusChange (the
// admin), it also copies the reporting link and changes the status.
export function DeploymentsTable({
  deployments,
  showOrganization = false,
  emptyMessage,
  onStatusChange,
}: {
  deployments: Deployment[];
  showOrganization?: boolean;
  emptyMessage: React.ReactNode;
  onStatusChange?: (id: string, status: Status) => void;
}) {
  const copyLink = (slug: string) =>
    navigator.clipboard
      .writeText(reportingLink(slug))
      .then(() => toast.success("Reporting link copied"))
      .catch(() => toast.error("Couldn't copy the link"));

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
              <TableHead className="text-right">Reports</TableHead>
              <TableHead>Theme</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
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
                  <TableCell className="text-right tabular-nums">
                    {d.reportCount}
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions for {d.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {d.status === "draft" ? (
                          <DropdownMenuItem disabled>
                            Its map and reporting link open once it&apos;s live
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/d/${d.slug}`} target="_blank">
                                Open map
                              </Link>
                            </DropdownMenuItem>
                            {onStatusChange && (
                              <DropdownMenuItem onSelect={() => copyLink(d.slug)}>
                                Copy reporting link
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {onStatusChange && (
                          <>
                            <DropdownMenuSeparator />
                            {statusActions[d.status].map((action) => (
                              <DropdownMenuItem
                                key={action.to}
                                onSelect={() => onStatusChange(d.id, action.to)}
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
