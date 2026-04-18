"use client";

import { ColumnDef } from "@tanstack/react-table";

// Updated type to match the new data shape
export type Application = {
  id: number;
  date: string;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  website: string;
  certificateOfIncorporation: string;
  status: "pending" | "approved" | "rejected";
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "organizationName",
    header: "Organization Name",
  },
  {
    accessorKey: "applicantName",
    header: "Applicant Name",
  },
  {
    accessorKey: "applicantEmail",
    header: "Applicant Email",
  },
  {
    accessorKey: "website",
    header: "Website",
  },
  {
    accessorKey: "certificateOfIncorporation",
    header: "Certificate Of Incorporation",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
