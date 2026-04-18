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
import { getR2PublicUrl } from "@/utils/r2";

import Link from "next/link";
import ActionsMenu from "./actions-menu";

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<
  TData extends { id: number; organizationName: string },
  TValue
>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
                  <ActionsMenu row={row} />
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
