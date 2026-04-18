"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/_trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/common/loader";

interface QuickOverviewItem {
  id: string;
  title: string;
  status: string;
  date: string;
  type?: string;
  href?: string;
}

interface QuickOverviewProps {
  title: string;
  items: QuickOverviewItem[];
  emptyMessage?: string;
  viewAllHref?: string;
  className?: string;
  enableActions?: boolean; // New prop to enable application actions
}

export function QuickOverview({
  title,
  items = [],
  emptyMessage = "No items to display",
  viewAllHref,
  className,
  enableActions = false,
}: QuickOverviewProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const queryClient = useQueryClient();

  const approveOrganizationMutation =
    trpc.approveOrganizationApplication.useMutation();
  const declineOrganizationMutation =
    trpc.declineOrganizationApplication.useMutation();

  const handleApproveApplication = async (id: string, title: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await approveOrganizationMutation.mutateAsync({
        id: parseInt(id),
      });
      if (!result.success) {
        toast.error(result.message || "Failed to approve application");
        return;
      }
      if (result.success) {
        queryClient.invalidateQueries();
        toast.success(`${title} approved successfully`);
      }
    } catch (error) {
      toast.error("Failed to approve application");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeclineApplication = async (id: string, title: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await declineOrganizationMutation.mutateAsync({
        id: parseInt(id),
      });
      if (!result.success) {
        toast.error(result.message || "Failed to decline application");
        return;
      }
      if (result.success) {
        queryClient.invalidateQueries();
        toast.success(`${title} declined successfully`);
      }
    } catch (error) {
      toast.error("Failed to decline application");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  const isApplication = title.toLowerCase().includes("application");
  const showApplicationActions = enableActions && isApplication;
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
      case "published":
      case "active":
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "investigating":
      case "draft":
      case "in process":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reported":
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "closed":
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className={cn("rounded-md shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-title">{title}</CardTitle>
        {viewAllHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm text-primary font-medium"
          >
            <Link href={viewAllHref}>View All</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="py-0 overflow-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="border rounded-sm">
            <Table className="">
              <TableHeader>
                <TableRow className="">
                  <TableHead className="">Title</TableHead>
                  <TableHead className="hidden md:flex">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="">
                {items.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm max-w-32 md:max-w-full line-clamp-1 overflow-hidden">
                          {item.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:flex">
                      <Badge
                        variant="outline"
                        className={getStatusColor(item.status)}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.date}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={loadingStates[item.id]}
                          >
                            {loadingStates[item.id] ? (
                              <Loader size="16" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {showApplicationActions &&
                          item.status.toLowerCase() === "pending" ? (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveApplication(item.id, item.title)
                                }
                                className="flex items-center hover:bg-accent hover:cursor-pointer"
                              >
                                <Check className="w-4 h-4 mr-2 text-green-500" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeclineApplication(item.id, item.title)
                                }
                                className="flex items-center hover:bg-destructive/10 hover:cursor-pointer"
                              >
                                <X className="w-4 h-4 mr-2 text-destructive" />
                                Decline
                              </DropdownMenuItem>
                            </>
                          ) : (
                            item.href && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={item.href}
                                  className="flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
