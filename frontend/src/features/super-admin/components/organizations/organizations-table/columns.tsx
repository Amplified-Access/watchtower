"use client";

import { ColumnDef } from "@tanstack/react-table";

// Updated type to match the new data shape
export type Organization = {
  id: number;
  date: string;
  organizationName: string;
};

export const columns: ColumnDef<Organization>[] = [
  {

    accessorKey: "organizationName",
    header: "Organization Name",
  },
  {
    accessorKey: "date",
    header: "Joined Date",
  },
];
