"use client";

import { ColumnDef } from "@tanstack/react-table";

// Type for organization watchers (no need for organization column since it's the same)
export type OrganizationWatcher = {
  id: string;
  name: string;
  email: string;
};

export const columns: ColumnDef<OrganizationWatcher>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];
