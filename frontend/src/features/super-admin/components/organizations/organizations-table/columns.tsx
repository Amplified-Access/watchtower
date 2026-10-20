"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

export type Organization = {
  id: string;
  date: string;
  organizationName: string;
  deploymentCount: number;
};

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: "organizationName",
    header: "Organization Name",
  },
  {
    // Links to the Deployments page, filtered to this organization.
    accessorKey: "deploymentCount",
    header: "Deployments",
    cell: ({ row }) => {
      const { id, deploymentCount } = row.original;
      if (deploymentCount === 0) {
        return <span className="text-muted-foreground">None yet</span>;
      }
      return (
        <Link
          href={`/superadmin/deployments?organization=${id}`}
          className="text-primary hover:underline"
        >
          {deploymentCount} deployment{deploymentCount === 1 ? "" : "s"}
        </Link>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Joined Date",
  },
];
