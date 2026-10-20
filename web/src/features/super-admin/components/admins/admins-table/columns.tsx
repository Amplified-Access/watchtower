"use client";

import { ColumnDef } from "@tanstack/react-table";

// Updated type to match the new data shape
export type Admin = {
  id: string;
  name: string;
  email: string;
  organization: string;
};

export const columns: ColumnDef<Admin>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "organization",
    header: "Organization",
  },
];
