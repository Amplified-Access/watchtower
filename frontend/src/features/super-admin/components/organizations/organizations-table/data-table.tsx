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
import {
  Check,
  EllipsisVertical,
  Eye,
  FileCheck,
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
import { BsQuestionCircle } from "react-icons/bs";

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<
  TData extends { id: number; organizationName: string },
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

  const handleShowDetails = () => {
    toast("Not yet implemented");
  };

  const handleRemoveOrganization = () => {
    toast("Not yet implemented");
  };

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
                        onClick={handleShowDetails}
                        className="hover:bg-accent hover:cursor-pointer"
                      >
                        <BsQuestionCircle className="text-green-500" />
                        Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleRemoveOrganization}
                        className="hover:bg-destructive/10 hover:cursor-pointer"
                      >
                        <Trash className="text-destructive" />
                        Delete
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
