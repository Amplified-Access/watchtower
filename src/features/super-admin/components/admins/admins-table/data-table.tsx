"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Check,
  EllipsisVertical,
  Eye,
  FileCheck,
  Lock,
  Trash,
  X,
} from "lucide-react";
import { getR2PublicUrl } from "@/utils/r2";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/_trpc/client";
import { useQueryClient } from "@tanstack/react-query";

interface DataTableProps<
  TData extends {
    id: string;
    name: string;
    email: string;
    organization: string;
  },
  TValue
> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<
  TData extends {
    id: string;
    name: string;
    email: string;
    organization: string;
  },
  TValue
>({ columns, data }: DataTableProps<TData, TValue>) {
  const queryClient = useQueryClient();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const approveOrganizationMutation =
    trpc.approveOrganizationApplication.useMutation();

  const resetPasswordMutation = trpc.resetUserPassword.useMutation();

  const handlePasswordReset = async (
    userId: string,
    email: string,
    name: string
  ) => {
    try {
      const result = await resetPasswordMutation.mutateAsync({
        userId,
        email,
      });

      if (result.success) {
        toast.success(`Password reset email sent to ${name}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
    }
  };

  // const handleApproveOrganization = async (id: number, name: string) => {
  //   try {
  //     const result = await approveOrganizationMutation.mutateAsync({
  //       id,
  //     });
  //     if (result.error) {
  //       toast.error(result.message);
  //       return;
  //     }
  //     if (result.success) {
  //       queryClient.invalidateQueries();
  //       toast.success(name + " approved");
  //     }
  //   } catch (error) {}
  // };

  console.log(data);

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
              <TableHead className="grid place-items-center">Action</TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  // Get the column id to determine which cell we're rendering
                  const columnId = cell.column.id;
                  const cellValue = cell.getValue() as string;
                  // Get the row's original data to access slug, email, website, etc.
                  const rowData = row.original as any;

                  if (columnId === "certificateOfIncorporation") {
                    const url = getR2PublicUrl(cellValue);
                    return (
                      <TableCell key={cell.id}>
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {rowData.organizationName} certificate
                        </Link>
                      </TableCell>
                    );
                  }

                  if (columnId === "applicantEmail") {
                    // Email as a mailto link
                    return (
                      <TableCell key={cell.id}>
                        <Link
                          href={`mailto:${cellValue}`}
                          className="text-blue-600 hover:underline"
                        >
                          {cellValue}
                        </Link>
                      </TableCell>
                    );
                  }

                  if (columnId === "website") {
                    // Website as a link
                    return (
                      <TableCell key={cell.id}>
                        <Link
                          href={
                            cellValue.startsWith("http")
                              ? cellValue
                              : `https://${cellValue}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {cellValue}
                        </Link>
                      </TableCell>
                    );
                  }

                  // Default rendering for other cells
                  return (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="grid place-items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn("hover:cursor-pointer hover:bg-accent")}
                    >
                      <EllipsisVertical size={16} className="" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          handlePasswordReset(
                            row.original.id,
                            row.original.email,
                            row.original.name
                          )
                        }
                        className="hover:bg-accent hover:cursor-pointer"
                        disabled={resetPasswordMutation.isPending}
                      >
                        <Lock className="text-green-500" />
                        {resetPasswordMutation.isPending
                          ? "Sending..."
                          : "Password reset"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          // handleApproveOrganization(
                          //   row.original.id,
                          //   row.original.organizationName
                          // )
                          toast.error("Not yet implemented")
                        }
                        className="hover:bg-destructive/10 hover:cursor-pointer"
                      >
                        <Trash className="text-destructive" />
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
